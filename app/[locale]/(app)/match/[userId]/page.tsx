"use client";

import { use, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  MessageCircle,
  Flag as FlagIcon,
  MoreVertical,
  ShieldOff,
  ShieldX,
  AlertTriangle,
  Share2,
} from "lucide-react";
import { shareOrCopy } from "@/lib/share/client";
import { STICKERS_BY_N } from "@/lib/data/stickers";
import { buildMatch, fmtDistance } from "@/lib/matches";
import type { CollectionEntry } from "@/lib/types";
import { useCollection } from "@/hooks/useCollection";
import { useFavorites } from "@/hooks/useFavorites";
import { useUser } from "@/hooks/useUser";
import { startChatWith } from "@/lib/chat/actions";
import { blockUser, unblockUser } from "@/lib/moderation/actions";
import { createClient } from "@/lib/supabase/client";
import { CROMIO_COLORS } from "@/lib/design/colors";
import { CromoCard } from "@/components/cromo/CromoCard";
import { Btn } from "@/components/ui/Btn";
import { IconBtn } from "@/components/ui/IconBtn";
import { Badge } from "@/components/ui/Badge";
import { Sheet } from "@/components/ui/Sheet";
import { ReportUserSheet } from "@/components/moderation/ReportUserSheet";
import { pushAppToast } from "@/lib/notifications/toast";

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

  const router = useRouter();
  const { collection } = useCollection();
  const { has, toggle } = useFavorites();
  const { user: me } = useUser();
  const [chatPending, startChatTransition] = useTransition();

  const [profile, setProfile] = useState<ProfileLite | null>(null);
  const [theirCol, setTheirCol] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [distanceM, setDistanceM] = useState<number | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [actionPending, startActionTransition] = useTransition();

  useEffect(() => {
    if (!isUuid) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    if (!supabase) return;

    setLoading(true);
    let cancelled = false;
    (async () => {
      const [profileRes, theirStickersRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, alias, display_name, avatar_url, color, plan, rating, trades_count")
          .eq("id", userId)
          .maybeSingle(),
        supabase.from("user_stickers").select("sticker_n, count").eq("user_id", userId),
      ]);
      if (cancelled) return;

      if (!profileRes.data) {
        setLoading(false);
        return;
      }

      const next = new Map<number, number>();
      for (const row of theirStickersRes.data ?? []) {
        next.set(row.sticker_n, row.count);
      }
      setTheirCol(next);

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
        if (cancelled) return;
        const found = (dist as { user_id: string; distance_m: number }[] | null)?.find(
          (r) => r.user_id === userId,
        );
        if (found) setDistanceM(found.distance_m);

        const { data: blockRow } = await supabase
          .from("user_blocks")
          .select("blocked_id")
          .eq("blocker_id", me.id)
          .eq("blocked_id", userId)
          .maybeSingle();
        if (cancelled) return;
        setBlocked(!!blockRow);
      }

      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, isUuid, me]);

  // buildMatch is reactive on `collection`: this ensures we don't render
  // a stale "te interesa / sin cromos para entregar" while useCollection
  // is still hydrating from Supabase.
  const match = useMemo(
    () => buildMatch(collection, theirCol),
    [collection, theirCol],
  );

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

  if (!profile) {
    return (
      <main className="flex min-h-dvh flex-col pb-24">
        <div className="flex items-center justify-between px-3 pt-14">
          <div className="h-10 w-10 animate-pulse rounded-md bg-paper" />
          <div className="h-7 w-24 animate-pulse rounded bg-paper" />
          <div className="flex gap-1.5">
            <div className="h-10 w-10 animate-pulse rounded-md bg-paper" />
            <div className="h-10 w-10 animate-pulse rounded-md bg-paper" />
          </div>
        </div>
        <section className="mt-3 flex flex-col items-center px-5 pb-4">
          <div className="h-20 w-20 animate-pulse rounded-full bg-paper" />
          <div className="mt-3 h-6 w-40 animate-pulse rounded bg-paper" />
          <div className="mt-1.5 h-3 w-52 animate-pulse rounded bg-paper" />
        </section>
        <div className="h-[68px] animate-pulse bg-paper" />
        <div className="mx-3 mt-1 grid grid-cols-2 gap-3 rounded-md border border-line bg-white p-3.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[78/110] animate-pulse rounded-card bg-paper"
            />
          ))}
        </div>
        <div className="fixed inset-x-0 bottom-20 z-40 mx-auto max-w-[430px] border-t border-black/5 bg-white/95 p-4 backdrop-blur md:bottom-0 md:max-w-[760px]">
          <div className="h-14 w-full animate-pulse rounded-xl bg-paper" />
        </div>
      </main>
    );
  }

  const isLead = match.theyGet.length === 0 && match.youGet.length > 0;
  const kindLabel = isLead ? "Te interesa" : "Match";
  const bannerBg = isLead
    ? `linear-gradient(135deg, ${CROMIO_COLORS.match.interest} 0%, #1B5DA8 100%)`
    : "linear-gradient(135deg, #1F8A4D 0%, #166B3B 100%)";
  const accentColor = isLead
    ? CROMIO_COLORS.match.interest
    : profile.color ?? CROMIO_COLORS.green[500];
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
            count={1}
            size="sm"
            selectBorder={sel ? color : null}
          />
        </button>
      );
    });

  return (
    <main className="flex min-h-dvh flex-col pb-24">
      <div className="flex items-center justify-between px-3 pt-14">
        <IconBtn
          ariaLabel="Atrás"
          onClick={() => {
            if (window.history.length > 1) router.back();
            else router.push("/mapa");
          }}
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </IconBtn>
        <span className="font-display text-2xl uppercase tracking-wider">
          {kindLabel}
        </span>
        <div className="flex items-center gap-1.5">
          <IconBtn
            ariaLabel={isFav ? "Quitar de favoritos" : "Añadir a favoritos"}
            onClick={() => toggle(profile.id)}
          >
            <FlagIcon
              size={16}
              strokeWidth={2}
              className={isFav ? "text-green-700" : ""}
              fill={isFav ? "currentColor" : "none"}
            />
          </IconBtn>
          <IconBtn
            ariaLabel="Más opciones"
            onClick={() => setShowActions(true)}
          >
            <MoreVertical size={16} strokeWidth={2} />
          </IconBtn>
        </div>
      </div>

      {blocked && (
        <div className="mx-3 mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <ShieldX size={14} className="mt-0.5 shrink-0" strokeWidth={2.2} />
          <div className="flex-1">
            <p className="font-semibold">Has bloqueado a este coleccionista.</p>
            <p className="mt-0.5 leading-snug">
              No aparecerá en tu mapa, búsquedas ni favoritos. Puedes desbloquearlo
              desde el menú ⋮ de arriba.
            </p>
          </div>
        </div>
      )}

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
          <span className="text-lg leading-none text-match-green">▼</span>
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
          <span className="text-lg leading-none text-match-red">▲</span>
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
        className="border-x border-b bg-white shadow-sh2"
        style={{
          borderColor: isLead ? "rgba(30,120,255,.35)" : "rgba(16,197,106,.30)",
        }}
      >
        <div className="flex items-baseline justify-between border-b border-line px-4 py-2.5">
          <span className="flex items-baseline gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text-2">
            <span className="text-base leading-none text-match-green">▼</span>
            Recibes
          </span>
          <span className="font-display tabular text-xs text-text-2">
            {match.youGet.length}
          </span>
        </div>
        {match.youGet.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-text-2">
            Sin cromos por recibir
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 p-4">
            {renderCromoEntries(match.youGet, youSel, setYouSel, "var(--y-green-500)")}
          </div>
        )}

        <div className="flex items-baseline justify-between border-y border-line px-4 py-2.5">
          <span className="flex items-baseline gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text-2">
            <span className="text-base leading-none text-match-red">▲</span>
            Entregas
          </span>
          <span className="font-display tabular text-xs text-text-2">
            {match.theyGet.length}
          </span>
        </div>
        {match.theyGet.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-text-2">
            Sin cromos por entregar
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 p-4">
            {renderCromoEntries(match.theyGet, theySel, setTheySel, CROMIO_COLORS.trade.give)}
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-20 z-40 mx-auto max-w-[430px] border-t border-black/5 bg-white/95 p-4 backdrop-blur md:bottom-0 md:max-w-[760px]">
        <Btn
          kind="primaryVibrant"
          full
          size="lg"
          disabled={chatPending}
          icon={<MessageCircle size={18} strokeWidth={2} />}
          onClick={() => {
            const youList = [...youSel].sort((a, b) => a - b);
            const theyList = [...theySel].sort((a, b) => a - b);
            const draftLines: string[] = [];
            if (youList.length > 0) {
              draftLines.push(
                `Hola! Me interesan tus cromos: ${youList.map((n) => `#${n}`).join(", ")}.`,
              );
            }
            if (theyList.length > 0) {
              draftLines.push(
                `A cambio te ofrezco: ${theyList.map((n) => `#${n}`).join(", ")}.`,
              );
            }
            const draftText = draftLines.join(" ");
            const draftQuery = draftText
              ? `draft=${encodeURIComponent(draftText)}`
              : undefined;
            startChatTransition(async () => {
              await startChatWith(profile.id, draftQuery);
            });
          }}
        >
          {chatPending ? "Abriendo chat…" : isLead ? "Proponer intercambio" : "Iniciar chat"}
        </Btn>
      </div>

      {showActions && (
        <Sheet
          title={`Opciones de @${profile.alias}`}
          onClose={() => setShowActions(false)}
        >
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                setShowActions(false);
                shareOrCopy({
                  title: `Cromio · @${profile.alias}`,
                  text: profile.display_name
                    ? `${profile.display_name} colecciona en Cromio.`
                    : `@${profile.alias} colecciona en Cromio.`,
                  path: `/match/${profile.id}`,
                });
              }}
              className="flex w-full items-center gap-3 rounded-md border border-line bg-white p-3 text-left hover:bg-paper"
            >
              <Share2 size={18} strokeWidth={2} className="text-text-2" />
              <div className="flex-1">
                <p className="text-sm font-bold">Compartir perfil</p>
                <p className="text-[11px] text-text-2">
                  Envía el enlace por WhatsApp, Telegram o copia al portapapeles.
                </p>
              </div>
            </button>
            {blocked ? (
              <button
                type="button"
                onClick={() => {
                  startActionTransition(async () => {
                    const r = await unblockUser(profile.id);
                    if (r?.error) {
                      pushAppToast({ kind: "error", body: "No se pudo desbloquear." });
                      return;
                    }
                    setBlocked(false);
                    pushAppToast({ kind: "success", body: `Has desbloqueado a @${profile.alias}.` });
                    setShowActions(false);
                  });
                }}
                disabled={actionPending}
                className="flex w-full items-center gap-3 rounded-md border border-line bg-white p-3 text-left hover:bg-paper disabled:opacity-50"
              >
                <ShieldOff size={18} strokeWidth={2} className="text-text-2" />
                <div className="flex-1">
                  <p className="text-sm font-bold">Desbloquear</p>
                  <p className="text-[11px] text-text-2">Volverá a aparecer en tu mapa.</p>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (
                    !window.confirm(
                      `¿Bloquear a @${profile.alias}? Dejaréis de veros en mapa, búsqueda y favoritos.`,
                    )
                  )
                    return;
                  startActionTransition(async () => {
                    const r = await blockUser(profile.id);
                    if (r?.error) {
                      pushAppToast({ kind: "error", body: "No se pudo bloquear." });
                      return;
                    }
                    setBlocked(true);
                    pushAppToast({ kind: "info", body: `Bloqueaste a @${profile.alias}.` });
                    setShowActions(false);
                  });
                }}
                disabled={actionPending}
                className="flex w-full items-center gap-3 rounded-md border border-line bg-white p-3 text-left hover:bg-paper disabled:opacity-50"
              >
                <ShieldX size={18} strokeWidth={2} className="text-text-2" />
                <div className="flex-1">
                  <p className="text-sm font-bold">Bloquear</p>
                  <p className="text-[11px] text-text-2">
                    Dejaréis de apareceros en mapa y búsqueda.
                  </p>
                </div>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setShowActions(false);
                setShowReport(true);
              }}
              className="flex w-full items-center gap-3 rounded-md border border-red-100 bg-red-50/40 p-3 text-left hover:bg-red-50"
            >
              <AlertTriangle size={18} strokeWidth={2} className="text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-700">Denunciar</p>
                <p className="text-[11px] text-red-700/80">
                  Reporte a moderación. Puedes bloquear también.
                </p>
              </div>
            </button>
          </div>
        </Sheet>
      )}

      {showReport && (
        <ReportUserSheet
          alias={profile.alias}
          userId={profile.id}
          onClose={() => setShowReport(false)}
          onDone={() => setBlocked(true)}
        />
      )}
    </main>
  );
}
