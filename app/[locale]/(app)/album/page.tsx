"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Plus, Globe, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";
import { COUNTRIES } from "@/lib/data/countries";
import { STICKERS, TOTAL_STICKERS } from "@/lib/data/stickers";
import { useCollection } from "@/hooks/useCollection";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { CromoCard } from "@/components/cromo/CromoCard";
import { AddCromoSheet } from "@/components/cromo/AddCromoSheet";
import { Flag } from "@/components/cromo/Flag";
import { Logo } from "@/components/Logo";
import { Chip } from "@/components/ui/Chip";
import { IconBtn } from "@/components/ui/IconBtn";

type Tab = "selecciones" | "especiales" | "estadios";
type Filter = "todos" | "falti" | "repe";

export default function AlbumPage() {
  const t = useTranslations();
  const { collection, stats, adjust } = useCollection();
  const { user } = useUser();
  const [tab, setTab] = useState<Tab>("selecciones");
  const [filter, setFilter] = useState<Filter>("todos");
  const [country, setCountry] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [matchBanner, setMatchBanner] = useState<
    { total: number; matches: number; leads: number } | null
  >(null);

  const tabPool = useMemo(() => {
    if (tab === "especiales") {
      return STICKERS.filter((s) => s.type === "foil_intro");
    }
    if (tab === "estadios") {
      return STICKERS.filter((s) => s.type === "host_city");
    }
    return STICKERS.filter((s) => s.type === "team_badge" || s.type === "team_photo" || s.type === "player");
  }, [tab]);

  const tabCountries = useMemo(() => {
    const codes = new Set(tabPool.map((s) => s.team_code).filter(Boolean) as string[]);
    return COUNTRIES.filter((c) => codes.has(c.code));
  }, [tabPool]);

  const list = useMemo(() => {
    return tabPool
      .filter((s) => country === "all" || s.team_code === country)
      .filter((s) => {
        const cnt = collection.get(s.n) ?? 0;
        if (filter === "falti") return cnt === 0;
        if (filter === "repe") return cnt >= 2;
        return true;
      });
  }, [tabPool, country, filter, collection]);

  useEffect(() => {
    if (!user) {
      setMatchBanner({ total: 0, matches: 0, leads: 0 });
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    let cancelled = false;
    supabase
      .rpc("find_nearby_users", { p_user_id: user.id, p_radius_m: 5000 })
      .then(({ data }) => {
        if (cancelled) return;
        const rows = (data ?? []) as Array<{ kind: "match" | "lead" }>;
        const matches = rows.filter((r) => r.kind === "match").length;
        const leads = rows.filter((r) => r.kind === "lead").length;
        setMatchBanner({ total: matches + leads, matches, leads });
      });
    return () => {
      cancelled = true;
    };
  }, [user, stats.owned]);

  return (
    <main className="flex flex-col">
      <div className="flex items-center justify-between px-5 pt-14">
        <Logo size="md" />
        <h1 className="sr-only">Cromio</h1>
        <IconBtn
          ariaLabel="Buscar y añadir cromo"
          onClick={() => setShowAdd(true)}
        >
          <Search size={18} strokeWidth={2} />
        </IconBtn>
      </div>

      <section className="px-5 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-2">
          {t("album.subtitle")}
        </p>
        <div className="mt-1.5 flex items-baseline gap-2 font-display text-text">
          <span className="tabular leading-none" style={{ fontSize: 64 }}>
            {stats.owned}
          </span>
          <span className="text-2xl text-mute">/{TOTAL_STICKERS}</span>
          <span className="ml-auto text-2xl text-green-700">
            {stats.pct.toFixed(1)}%
          </span>
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-700 to-green-500 transition-[width]"
            style={{ width: `${stats.pct}%` }}
          />
        </div>
        <div className="mt-2 flex gap-3.5 text-xs text-text-2">
          <span><b className="text-text">{stats.repes}</b> {t("album.duplicates")}</span>
          <span><b className="text-text">{stats.missing}</b> {t("album.missing")}</span>
        </div>
      </section>

      {matchBanner === null ? (
        <div className="mx-4 mt-3 h-[68px] animate-pulse rounded-md border border-line bg-paper" />
      ) : matchBanner.total > 0 ? (
        <Link
          href="/mapa"
          className="mx-4 mt-3 flex items-center gap-2.5 rounded-md border border-green-100 bg-green-50 p-3"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-green-500 text-white">
            <MapPin size={18} strokeWidth={2.2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-bold text-green-700">
              Hay {matchBanner.total} usuario{matchBanner.total === 1 ? "" : "s"} con cromos
            </span>
            <span className="mt-0.5 block text-xs text-text">
              {matchBanner.matches} Match{matchBanner.matches === 1 ? "" : "es"} y {matchBanner.leads} de Interés
            </span>
          </span>
          <ArrowRight size={16} className="text-green-700" />
        </Link>
      ) : (
        <Link
          href="/mapa"
          className="mx-4 mt-3 flex items-center gap-2.5 rounded-md border border-gold/40 bg-gold/10 p-3"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-gold text-white">
            <Search size={18} strokeWidth={2.4} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-bold text-gold-dark">
              No hay usuarios con cromos
            </span>
            <span className="mt-0.5 block text-xs text-text">
              Agrega cromos a tu colección o incrementa el radio de búsqueda
            </span>
          </span>
          <ArrowRight size={16} className="text-gold" />
        </Link>
      )}

      <div className="mt-5 flex gap-5 border-b border-line px-5">
        {(["selecciones", "especiales", "estadios"] as const).map((id) => (
          <button
            key={id}
            onClick={() => {
              setTab(id);
              if (id !== "selecciones") setCountry("all");
            }}
            className={`-mb-px py-2 text-[14.5px] capitalize transition-colors ${
              tab === id
                ? "border-b-2 border-text font-bold text-text"
                : "border-b-2 border-transparent font-medium text-mute"
            }`}
          >
            {id}
          </button>
        ))}
      </div>

      <div className="scroll-hide flex gap-2 overflow-x-auto px-4 pb-1 pt-3">
        <Chip active={country === "all"} onClick={() => setCountry("all")}>
          <Globe size={14} strokeWidth={2} /> Todos
        </Chip>
        {tabCountries.map((c) => (
          <Chip key={c.code} active={country === c.code} onClick={() => setCountry(c.code)}>
            <Flag country={c} size={20} />
            {c.short}
          </Chip>
        ))}
      </div>

      <div className="flex gap-2 px-4 pb-2 pt-3">
        {(() => {
          const inScope = tabPool.filter((s) => country === "all" || s.team_code === country);
          const repeSum = inScope.reduce((s, x) => {
            const c = collection.get(x.n) ?? 0;
            return c >= 2 ? s + (c - 1) : s;
          }, 0);
          const counts = {
            todos: inScope.length,
            falti: inScope.filter((s) => (collection.get(s.n) ?? 0) === 0).length,
            repe: repeSum,
          };
          return (
            <>
              <Chip active={filter === "todos"} onClick={() => setFilter("todos")}>
                Todos · {counts.todos}
              </Chip>
              <Chip active={filter === "falti"} onClick={() => setFilter("falti")}>
                Me faltan · {counts.falti}
              </Chip>
              <Chip active={filter === "repe"} onClick={() => setFilter("repe")}>
                Repetidas · {counts.repe}
              </Chip>
            </>
          );
        })()}
      </div>

      <div className="grid grid-cols-3 gap-3 px-4 pb-6 pt-1">
        {list.map((s) => (
          <CromoCard
            key={s.n}
            sticker={s}
            count={collection.get(s.n) ?? 0}
            size="sm"
            onAdjust={(d) => adjust(s.n, d)}
          />
        ))}
        {list.length === 0 && (
          <div className="col-span-3 py-10 text-center text-sm text-text-2">
            Sin cromos para este filtro
          </div>
        )}
      </div>

      <button
        className="fixed bottom-24 right-5 z-30 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-green-500 to-green-700 text-white shadow-sh3 md:bottom-8"
        aria-label="Añadir cromo"
        onClick={() => setShowAdd(true)}
      >
        <Plus size={26} strokeWidth={2.4} />
      </button>

      {showAdd && (
        <AddCromoSheet
          collection={collection}
          onClose={() => setShowAdd(false)}
          onAdjust={adjust}
        />
      )}
    </main>
  );
}
