"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, MessageCircle, Flag as FlagIcon } from "lucide-react";
import { MOCK_USERS_BY_ID } from "@/lib/data/mock-users";
import { buildMockCollection } from "@/lib/data/stickers";
import { buildMatch, fmtDistance } from "@/lib/matches";
import { useCollection } from "@/hooks/useCollection";
import { useFavorites } from "@/hooks/useFavorites";
import { CromoCard } from "@/components/cromo/CromoCard";
import { Btn } from "@/components/ui/Btn";
import { Badge } from "@/components/ui/Badge";

export default function MatchDetailPage({
  params,
}: {
  params: Promise<{ locale: string; userId: string }>;
}) {
  const { userId } = use(params);
  const u = MOCK_USERS_BY_ID[userId];
  const { collection } = useCollection(247);
  const { has, toggle } = useFavorites();
  const isFav = u ? has(u.id) : false;

  const userIdx = u ? Object.keys(MOCK_USERS_BY_ID).indexOf(u.id) + 1 : 1;
  const match = useMemo(
    () => buildMatch(collection, buildMockCollection(userIdx)),
    [collection, userIdx],
  );

  const [youSel, setYouSel] = useState<Set<number>>(
    new Set(match.youGet.map((c) => c.n)),
  );
  const [theySel, setTheySel] = useState<Set<number>>(
    new Set(match.theyGet.map((c) => c.n)),
  );

  if (!u) {
    return (
      <main className="grid h-dvh place-items-center px-5 pt-14">
        <p className="text-sm text-text-2">Usuario no encontrado</p>
      </main>
    );
  }

  const isLead = match.theyGet.length === 0 && match.youGet.length > 0;
  const kindLabel = isLead ? "Te interesa" : "Match";
  const bannerBg = isLead
    ? "linear-gradient(135deg, #2D7DD8 0%, #1B5DA8 100%)"
    : "linear-gradient(135deg, #1F8A4D 0%, #166B3B 100%)";
  const accentColor = isLead ? "#2D7DD8" : "#1FAE5A";

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
          onClick={() => toggle(u.id)}
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
          {u.alias.slice(0, 2).toUpperCase()}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <h2 className="font-display text-2xl">{u.alias}</h2>
          {u.pro && <Badge kind="gold">Pro</Badge>}
        </div>
        <p className="text-xs text-text-2">
          ≈{fmtDistance(u.distM)} · ★{u.rating} · {u.trades} intercambios
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
          {match.youGet.map((c) => {
            const sel = youSel.has(c.n);
            return (
              <button
                key={c.n}
                onClick={() => {
                  const next = new Set(youSel);
                  if (next.has(c.n)) next.delete(c.n);
                  else next.add(c.n);
                  setYouSel(next);
                }}
                className="transition-opacity"
                style={{ opacity: sel ? 1 : 0.42 }}
              >
                <CromoCard
                  sticker={c}
                  count={1}
                  size="sm"
                  selectBorder={sel ? "var(--y-green-500)" : null}
                />
              </button>
            );
          })}
        </div>
        <div className="self-stretch bg-line" style={{ minHeight: 200 }} />
        <div className="grid grid-cols-2 gap-1.5">
          {match.theyGet.length === 0 && (
            <p className="col-span-2 py-6 text-center text-xs text-text-2">
              Sin cromos por entregar
            </p>
          )}
          {match.theyGet.map((c) => {
            const sel = theySel.has(c.n);
            return (
              <button
                key={c.n}
                onClick={() => {
                  const next = new Set(theySel);
                  if (next.has(c.n)) next.delete(c.n);
                  else next.add(c.n);
                  setTheySel(next);
                }}
                className="transition-opacity"
                style={{ opacity: sel ? 1 : 0.42 }}
              >
                <CromoCard
                  sticker={c}
                  count={2}
                  size="sm"
                  selectBorder={sel ? "#D7263D" : null}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-20 z-40 mx-auto max-w-[430px] border-t border-black/5 bg-white/95 p-4 backdrop-blur">
        <Btn
          kind="primaryVibrant"
          full
          size="lg"
          icon={<MessageCircle size={18} strokeWidth={2} />}
        >
          {isLead ? "Proponer intercambio" : "Iniciar chat"}
        </Btn>
      </div>
    </main>
  );
}
