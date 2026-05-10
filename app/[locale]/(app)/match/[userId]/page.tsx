"use client";

import { use, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, MessageCircle, Flag as FlagIcon } from "lucide-react";
import { STICKERS_BY_N } from "@/lib/data/stickers";
import { buildMatch, fmtDistance } from "@/lib/matches";
import type { CollectionEntry, MatchResult } from "@/lib/types";
import { useCollection } from "@/hooks/useCollection";
import { useFavorites } from "@/hooks/useFavorites";
import { useUser } from "@/hooks/useUser";
import { startChatWith } from "@/lib/chat/actions";
import { createClient } from "@/lib/supabase/client";
import { CromoCard } from "@/components/cromo/CromoCard";
import { Btn } from "@/components/ui/Btn";
import { Badge } from "@/components/ui/Badge";

type ProfileLite = {
  id: string;
  alias: string;
  display_name: string | null;
  avatar_url: string | null;
  color: string | null;
  rating: number | null;
  trades_count: number | null;
  pro: boolean;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function MatchDetailPage({
  params,
}: {
  params: Promise<{ locale: string; userId: string }>;
}) {
  const { userId } = use(params);
  const isUuid = UUID_RE.test(userId);

  const { collection } = useCollection();
  const { has, toggle } = useFavorites();
  const { user: me } = useUser();
  const [chatPending, startChatTransition] = useTransition();

  const [profile, setProfile] = useState<ProfileLite | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [distanceM, setDistanceM] = useState<number | null>(null);

  useEffect(() => {
    if (!isUuid) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    if (!supabase) return;

    setLoading(true);
    (async () => {
      const [profileRes, theirStickersRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, alias, display_name, avatar_url, color, plan, rating, trades_count")
          .eq("id", userId)
          .maybeSingle(),
        supabase.from("user_stickers").select("sticker_n, count").eq("user_id", userId),
      ]);

      if (!profileRes.data) {
        setLoading(false);
        return;
      }

      const theirCol = new Map<number, number>();
      for (const row of theirStickersRes.data ?? []) {
        theirCol.set(row.sticker_n, row.count);
      }
      setMatch(buildMatch(collection, theirCol));

      setProfile({
        id: profileRes.data.id,
        alias: profileRes.data.alias,
        display_name: profileRes.data.display_name,
        avatar_url: profileRes.data.avatar_url,
        color: profileRes.data.color,
        rating: profileRes.data.rating,
        trades_count: profileRes.data.trades_count,
        pro: profileRes.data.plan === "pro",
      });

      if (me) {
        const { data: dist } = await supabase.rpc("find_nearby_users", {
          p_user_id: me.id,
          p_radius_m: 50000,
        });
        const found = (dist as { user_id: string; distance_m: number }[] | null)?.find(
          (r) => r.user_id === userId,
        );
        if (found) setDistanceM(found.distance_m);
      }

      setLoading(false);
    })();
  }, [userId, isUuid, collection, me]);

  const isFav = profile ? has(profile.id) : false;

  const [youSel, setYouSel] = useState<Set<number>>(new Set());
  const [theySel, setTheySel] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (match) {
      setYouSel(new Set(match.youGet.map((c) => c.n)));
      setTheySel(new Set(match.theyGet.map((c) => c.n)));
    }
  }, [match]);

  if (!isUuid) {
    return (
      <main className="grid h-dvh place-items-center px-5 pt-14">
        <p className="text-sm text-text-2">Usuario no válido</p>
      </main>
    );
  }

  if (!profile && !loading) {
    return (
      <main className="grid h-dvh place-items-center px-5 pt-14">
        <p className="text-sm text-text-2">Usuario no encontrado</p>
      </main>
    );
  }

  if (!profile || !match) {
    return (
      <main className="flex min-h-dvh flex-col px-5 pt-14">
        <div className="mt-10 flex flex-col items-center gap-2">
          <div className="h-20 w-20 animate-pulse rounded-full bg-paper" />
          <div className="mt-2 h-4 w-32 animate-pulse rounded bg-paper" />
          <div className="h-3 w-48 animate-pulse rounded bg-paper" />
        </div>
      </main>
    );
  }

  const isLead = match.theyGet.length === 0 && match.youGet.length > 0;
  const kindLabel = isLead ? "Te interesa" : "Match";
  const bannerBg = isLead
    ? "linear-gradient(135deg, #2D7DD8 0%, #1B5DA8 100%)"
    : "linear-gradient(135deg, #1F8A4D 0%, #166B3B 100%)";
  const accentColor = isLead ? "#2D7DD8" : profile.color ?? "#1FAE5A";
  const distanceLabel = distanceM != null ? fmtDistance(distanceM) : null;

  const renderCromoEntries = (
    entries: CollectionEntry[],
    selSet: Set<number>,
    setSel: (s: Set<number>) => void,
    color: string,
  ) =>
    entries.map((c) => {
      const stickerData = STICKERS_BY_N.get(c.n) ?? c;
      const sel = selSet.has(c.n);
      return (
        <button
          key={c.n}
          onClick={() => {
            const next = new Set(selSet);
            if (next.has(c.n)) next.delete(c.n);
            else next.add(c.n);
            setSel(next);
          }}
          className="transition-opacity"
          style={{ opacity: sel ? 1 : 0.42 }}
        >
          <CromoCard
            sticker={stickerData}
            count={c.count || 1}
            size="sm"
            selectBorder={sel ? color : null}
          />
        </button>
      );
    });

  return (
    <main className="flex min-h-dvh flex-col pb-24">
      <div className="flex items-center justify-between px-3 pt-14">
        <Link
          href="/mapa"
          className="grid h-9 w-9 place-items-center rounded-md border border-line bg-white"
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </Link>
        <span className="font-display text-2xl uppercase tracking-wider">
          {kindLabel}
        </span>
        <button
          onClick={() => toggle(profile.id)}
          className="grid h-9 w-9 place-items-center rounded-md border border-line bg-white"
          aria-label={isFav ? "Quitar de favoritos" : "Añadir a favoritos"}
        >
          <FlagIcon
            size={16}
            strokeWidth={2}
            className={isFav ? "text-green-700" : ""}
          />
        </button>
      </div>

      <section className="mt-3 flex flex-col items-center px-5 pb-4">
        <div
          className="grid h-20 w-20 place-items-center rounded-full font-display text-3xl text-white shadow-sh2"
          style={{ background: accentColor }}
        >
          {profile.alias.slice(0, 2).toUpperCase()}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <h2 className="font-display text-2xl">
            {profile.display_name ?? profile.alias}
          </h2>
          {profile.pro && <Badge kind="gold">Pro</Badge>}
        </div>
        <p className="text-xs text-text-2">
          {distanceLabel && `≈${distanceLabel}`}
          {profile.rating && ` · ★${profile.rating}`}
          {profile.trades_count != null && ` · ${profile.trades_count} intercambios`}
        </p>
      </section>

      <div
        className="grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] items-center gap-3 px-3.5 py-3 text-white shadow-sh2"
        style={{ background: bannerBg }}
      >
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg leading-none" style={{ color: "#5BE491" }}>▼</span>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">
              Recibes
            </span>
            <span className="font-display text-2xl leading-none">
              {youSel.size}/{match.youGet.length}
            </span>
          </div>
        </div>
        <div className="self-stretch bg-white/10" />
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg leading-none" style={{ color: "#FF6B7A" }}>▲</span>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">
              Entregas
            </span>
            <span className="font-display text-2xl leading-none">
              {theySel.size}/{match.theyGet.length}
            </span>
          </div>
        </div>
      </div>

      <div
        className="grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] items-start gap-3 border-x border-b bg-white p-3.5 shadow-sh2"
        style={{
          borderColor: isLead ? "rgba(45,125,216,.35)" : "rgba(31,138,77,.25)",
        }}
      >
        <div className="grid grid-cols-2 gap-1.5">
          {match.youGet.length === 0 && (
            <p className="col-span-2 py-6 text-center text-xs text-text-2">
              Sin cromos por recibir
            </p>
          )}
          {renderCromoEntries(match.youGet, youSel, setYouSel, "var(--y-green-500)")}
        </div>
        <div className="self-stretch bg-line" style={{ minHeight: 200 }} />
        <div className="grid grid-cols-2 gap-1.5">
          {match.theyGet.length === 0 && (
            <p className="col-span-2 py-6 text-center text-xs text-text-2">
              Sin cromos por entregar
            </p>
          )}
          {renderCromoEntries(match.theyGet, theySel, setTheySel, "#D7263D")}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-20 z-40 mx-auto max-w-[430px] border-t border-black/5 bg-white/95 p-4 backdrop-blur">
        <Btn
          kind="primaryVibrant"
          full
          size="lg"
          disabled={chatPending}
          icon={<MessageCircle size={18} strokeWidth={2} />}
          onClick={() => {
            startChatTransition(async () => {
              await startChatWith(profile.id);
            });
          }}
        >
          {chatPending ? "Abriendo chat…" : isLead ? "Proponer intercambio" : "Iniciar chat"}
        </Btn>
      </div>
    </main>
  );
}
