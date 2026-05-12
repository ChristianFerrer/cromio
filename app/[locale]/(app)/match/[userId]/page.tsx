"use client";

import { use, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  ChevronLeft,
  MessageCircle,
  Flag as FlagIcon,
  MoreVertical,
  ShieldOff,
  ShieldX,
  AlertTriangle,
  Share2,
  Loader2,
} from "lucide-react";
import { shareOrCopy } from "@/lib/share/client";
import { STICKERS_BY_N, TOTAL_STICKERS } from "@/lib/data/stickers";
import { buildMatch, fmtDistance } from "@/lib/matches";
import type { CollectionEntry } from "@/lib/types";
import { useCollection } from "@/hooks/useCollection";
import { useFavorites } from "@/hooks/useFavorites";
import { useUser } from "@/hooks/useUser";
import { startChatWith } from "@/lib/chat/actions";
import { requestTrade } from "@/lib/trades/actions";
import type { TradeRequestRow } from "@/lib/trades/queries";
import { TradeRequestSheet } from "@/components/trade/TradeRequestSheet";
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

  const [activeTrade, setActiveTrade] = useState<TradeRequestRow | null>(null);
  const [tradeRefreshTick, setTradeRefreshTick] = useState(0);
  const [showTradeSheet, setShowTradeSheet] = useState(false);
  const [tradePending, startTradeTransition] = useTransition();
  const [existingChatId, setExistingChatId] = useState<string | null>(null);

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

  // Active trade between me and this user (pending or accepted), plus the
  // id of any pre-existing chat between us so the CTA can read "Ir al chat"
  // instead of "Iniciar chat". Both refetch on `tradeRefreshTick` and via
  // realtime so the button reflects state when the other side acts.
  useEffect(() => {
    if (!me || !isUuid) return;
    const supabase = createClient();
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      const [tradeRes, chatRes] = await Promise.all([
        supabase
          .from("trade_requests")
          .select(
            "id, from_user_id, to_user_id, status, items, created_at, accepted_at, done_at, resolved_at",
          )
          .in("status", ["pending", "accepted"])
          .or(
            `and(from_user_id.eq.${me.id},to_user_id.eq.${userId}),and(from_user_id.eq.${userId},to_user_id.eq.${me.id})`,
          )
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("chats")
          .select("id")
          .or(
            `and(user_a.eq.${me.id},user_b.eq.${userId}),and(user_a.eq.${userId},user_b.eq.${me.id})`,
          )
          .limit(1)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setActiveTrade((tradeRes.data as TradeRequestRow | null) ?? null);
      setExistingChatId((chatRes.data?.id as string | null) ?? null);
    })();

    const channel = supabase
      .channel(`trade-${me.id}-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trade_requests" },
        () => setTradeRefreshTick((t) => t + 1),
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [me, userId, isUuid, tradeRefreshTick]);

  // buildMatch is reactive on `collection`: this ensures we don't render
  // a stale "te interesa / sin cromos para entregar" while useCollection
  // is still hydrating from Supabase.
  const match = useMemo(
    () => buildMatch(collection, theirCol),
    [collection, theirCol],
  );

  const otherStats = useMemo(() => {
    let owned = 0;
    let repes = 0;
    for (const count of theirCol.values()) {
      if (count >= 1) owned++;
      if (count >= 2) repes += count - 1;
    }
    return {
      owned,
      missing: TOTAL_STICKERS - owned,
      repes,
      pct: TOTAL_STICKERS > 0 ? (owned / TOTAL_STICKERS) * 100 : 0,
    };
  }, [theirCol]);

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
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[430px] border-t border-black/5 bg-white/95 px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-4 backdrop-blur md:max-w-[760px]">
          <div className="h-14 w-full animate-pulse rounded-xl bg-paper" />
        </div>
      </main>
    );
  }

  const isLead = match.theyGet.length === 0 && match.youGet.length > 0;
  const kindLabel = isLead ? "Te interesa" : "Match";
  const bannerBg = isLead
    ? `linear-gradient(135deg, ${CROMIO_COLORS.match.interest} 0%, #1B5DA8 100%)`
    : "linear-gradient(135deg, #10C56A 0%, #089258 100%)";
  const accentColor = isLead
    ? CROMIO_COLORS.match.interest
    : CROMIO_COLORS.green[500];
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

      <section className="mt-3 px-5 pb-3">
        {/* Compact header: name + meta on the left, avatar on the right. */}
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-display text-2xl">
                {profile.display_name ?? profile.alias}
              </h2>
              {profile.pro && <Badge kind="gold">Pro</Badge>}
            </div>
            <p className="mt-0.5 text-xs text-text-2">
              {distanceLabel && `≈${distanceLabel}`}
              {profile.rating && ` · ★${profile.rating}`}
              {profile.trades_count != null && ` · ${profile.trades_count} intercambios`}
            </p>
          </div>
          <div
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full font-display text-xl text-white shadow-sh1"
            style={{ background: accentColor }}
          >
            {profile.alias.slice(0, 2).toUpperCase()}
          </div>
        </div>

        <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-text-2">
          Progreso:
        </p>
        <div className="mt-1 flex items-baseline gap-2 font-display text-text">
          <span className="tabular leading-none" style={{ fontSize: 40 }}>
            {otherStats.owned}
          </span>
          <span className="text-base text-mute">/{TOTAL_STICKERS}</span>
          <span className="ml-auto text-base text-green-700">
            {otherStats.pct.toFixed(1)}%
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-700 to-green-500"
            style={{ width: `${otherStats.pct}%` }}
          />
        </div>
        <div className="mt-2 flex gap-3.5 text-xs text-text-2">
          <span>
            <b className="text-text">{otherStats.repes}</b> repes
          </span>
          <span>
            <b className="text-text">{otherStats.missing}</b> faltan
          </span>
        </div>
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
        className="grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] items-start gap-3 border-x border-b bg-white p-3.5 shadow-sh2"
        style={{
          borderColor: isLead ? "rgba(30,120,255,.35)" : "rgba(16,197,106,.30)",
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
          {renderCromoEntries(match.theyGet, theySel, setTheySel, CROMIO_COLORS.trade.give)}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[430px] gap-2 border-t border-black/5 bg-white/95 px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-4 backdrop-blur md:max-w-[760px]">
        <div className="flex-1">
          <Btn
            kind="primaryVibrant"
            full
            size="lg"
            disabled={chatPending}
            icon={<MessageCircle size={18} strokeWidth={2} />}
            onClick={() => {
              if (existingChatId) {
                router.push(`/chat/${existingChatId}`);
                return;
              }
              startChatTransition(async () => {
                await startChatWith(profile.id);
              });
            }}
          >
            {chatPending
              ? "Abriendo chat…"
              : existingChatId
                ? "Ir al chat"
                : "Iniciar chat"}
          </Btn>
        </div>
        <TradeButton
          activeTrade={activeTrade}
          matchEmpty={match.youGet.length === 0 && match.theyGet.length === 0}
          pending={tradePending}
          onSend={() =>
            startTradeTransition(async () => {
              const r = await requestTrade(
                profile.id,
                [...youSel],
                [...theySel],
              );
              if (!r.ok) {
                const msg =
                  r.error === "empty_trade"
                    ? "Selecciona al menos un cromo para intercambiar."
                    : r.error === "already_pending"
                      ? "Ya tenéis una solicitud activa."
                      : "Algo falló. Inténtalo otra vez.";
                pushAppToast({ kind: "error", body: msg });
                return;
              }
              pushAppToast({ kind: "success", body: "Solicitud enviada" });
              setTradeRefreshTick((t) => t + 1);
            })
          }
          onOpenSheet={() => setShowTradeSheet(true)}
        />
      </div>

      {showTradeSheet && activeTrade && me && (
        <TradeRequestSheet
          req={activeTrade}
          meId={me.id}
          otherAlias={profile.alias}
          onClose={() => setShowTradeSheet(false)}
          onChanged={() => setTradeRefreshTick((t) => t + 1)}
        />
      )}

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

function TradeButton({
  activeTrade,
  matchEmpty,
  pending,
  onSend,
  onOpenSheet,
}: {
  activeTrade: TradeRequestRow | null;
  matchEmpty: boolean;
  pending: boolean;
  onSend: () => void;
  onOpenSheet: () => void;
}) {
  // The button is always green. The only state we surface is "there is an
  // active trade between us right now" — either pending or accepted but not
  // yet settled. A red dot with a white ring sits on top while that holds;
  // it disappears the moment the trade closes (done/rejected/cancelled) or
  // when no trade exists.
  const hasActive =
    activeTrade?.status === "pending" || activeTrade?.status === "accepted";

  // No active trade and no cromos to swap — keep the button green but
  // disabled (visually muted via opacity) so a tap doesn't fire an
  // empty_trade error against the RPC.
  const isDisabled = pending || (matchEmpty && !hasActive);

  const onClick = () => {
    if (hasActive) onOpenSheet();
    else onSend();
  };

  const Icon = pending ? Loader2 : ArrowLeftRight;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-label="Intercambiar"
      className="relative grid h-14 w-14 shrink-0 place-items-center rounded-card border border-line bg-white transition-colors hover:bg-paper disabled:opacity-50"
    >
      <Icon
        size={22}
        strokeWidth={2.4}
        className={`text-green-700 ${pending ? "animate-spin" : "rotate-90"}`}
      />
      {hasActive && (
        <span
          aria-hidden
          className="absolute right-2 top-2 h-3 w-3 rounded-full bg-red-600 ring-2 ring-white"
        />
      )}
    </button>
  );
}
