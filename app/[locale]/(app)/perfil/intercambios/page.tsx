import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  Inbox,
  Send,
  Handshake,
  History,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  loadCompletedTradesForCurrentUser,
  loadIncomingPendingTrades,
  loadOutgoingPendingTrades,
  loadAcceptedTrades,
  type TradeInboxRow,
} from "@/lib/trades/queries";
import { IconLink } from "@/components/ui/IconBtn";
import { InboxActions } from "@/components/trades/InboxActions";

type Tab = "recibidas" | "enviadas" | "aceptadas" | "historial";
const TABS: Tab[] = ["recibidas", "enviadas", "aceptadas", "historial"];
const LABELS: Record<Tab, string> = {
  recibidas: "Recibidas",
  enviadas: "Enviadas",
  aceptadas: "Aceptadas",
  historial: "Historial",
};
const ICONS: Record<Tab, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  recibidas: Inbox,
  enviadas: Send,
  aceptadas: Handshake,
  historial: History,
};

function parseTab(v: string | string[] | undefined): Tab {
  const s = Array.isArray(v) ? v[0] : v;
  return (TABS as string[]).includes(s ?? "") ? (s as Tab) : "recibidas";
}

export default async function IntercambiosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const tab = parseTab((await searchParams).tab);

  const [recibidas, enviadas, aceptadas, historial] = await Promise.all([
    loadIncomingPendingTrades(),
    loadOutgoingPendingTrades(),
    loadAcceptedTrades(),
    loadCompletedTradesForCurrentUser(),
  ]);

  let totalCromos = 0;
  for (const t of historial) {
    totalCromos += t.items.from_gives.reduce((s, i) => s + (i.qty ?? 0), 0);
    totalCromos += t.items.to_gives.reduce((s, i) => s + (i.qty ?? 0), 0);
  }

  const counts: Record<Tab, number> = {
    recibidas: recibidas.length,
    enviadas: enviadas.length,
    aceptadas: aceptadas.length,
    historial: historial.length,
  };

  return (
    <main className="px-5 pb-10 pt-14">
      <div className="flex items-center gap-2">
        <IconLink href="/perfil" ariaLabel="Volver al perfil">
          <ChevronLeft size={18} strokeWidth={2} />
        </IconLink>
        <h1 className="font-display text-2xl">Intercambios</h1>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat
          label="Completados"
          value={historial.length.toString()}
          icon={<CheckCircle2 size={16} strokeWidth={2.2} className="text-green-700" />}
        />
        <Stat
          label="Cromos movidos"
          value={totalCromos.toString()}
          icon={<ArrowDown size={16} strokeWidth={2.2} className="text-text-2" />}
        />
      </div>

      <nav
        aria-label="Filtros"
        className="scroll-hide mt-5 -mx-5 flex gap-1.5 overflow-x-auto px-5"
      >
        {TABS.map((t) => {
          const active = t === tab;
          const Icon = ICONS[t];
          const c = counts[t];
          return (
            <Link
              key={t}
              href={`/perfil/intercambios?tab=${t}`}
              scroll={false}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                active
                  ? "bg-green-500 text-white"
                  : "border border-line bg-white text-text-2"
              }`}
            >
              <Icon size={13} strokeWidth={2.2} />
              {LABELS[t]}
              {c > 0 && (
                <span
                  className={`grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold ${
                    active ? "bg-white text-green-700" : "bg-green-500 text-white"
                  }`}
                >
                  {c}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-5">
        {tab === "recibidas" && <RecibidasList items={recibidas} />}
        {tab === "enviadas" && <EnviadasList items={enviadas} />}
        {tab === "aceptadas" && <AceptadasList items={aceptadas} />}
        {tab === "historial" && (
          <HistorialList
            items={historial.map((t) => ({
              id: t.id,
              other: t.other,
              items: t.items,
              direction: t.direction,
              done_at: t.done_at,
            }))}
          />
        )}
      </div>
    </main>
  );
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function TradeSummary({
  recibi,
  entregue,
}: {
  recibi: number;
  entregue: number;
}) {
  return (
    <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px]">
      <div className="flex items-center justify-between rounded bg-paper px-2.5 py-1.5">
        <span className="inline-flex items-center gap-1 text-text-2">
          <ArrowDown size={11} strokeWidth={2.6} className="text-green-700" />
          Recibo
        </span>
        <span className="font-display text-base text-text">{recibi}</span>
      </div>
      <div className="flex items-center justify-between rounded bg-paper px-2.5 py-1.5">
        <span className="inline-flex items-center gap-1 text-text-2">
          <ArrowUp size={11} strokeWidth={2.6} className="text-red-600" />
          Entrego
        </span>
        <span className="font-display text-base text-text">{entregue}</span>
      </div>
    </div>
  );
}

function CardHeader({ row }: { row: TradeInboxRow }) {
  const initials = row.other.alias.slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/match/${row.other.id}`}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-green-500 font-display text-lg text-white"
      >
        {initials}
      </Link>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">
          {row.other.display_name ?? `@${row.other.alias}`}
        </p>
        <p className="truncate text-xs text-text-2">
          {fmtDate(row.created_at)}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-line bg-gradient-to-b from-paper to-bone px-6 py-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-green-100 text-green-700">
        <CheckCircle2 size={22} strokeWidth={2.2} />
      </div>
      <h2 className="mt-3 font-display text-lg">{title}</h2>
      <p className="mt-1 max-w-xs text-xs leading-snug text-text-2">{body}</p>
    </div>
  );
}

function RecibidasList({ items }: { items: TradeInboxRow[] }) {
  if (items.length === 0)
    return (
      <EmptyState
        title="Sin solicitudes pendientes"
        body="Cuando otro coleccionista te envíe una solicitud de intercambio aparecerá aquí."
      />
    );
  return (
    <ul className="space-y-2">
      {items.map((row) => {
        // Recibidas: from_gives es lo que ME ofrecen (lo que recibo), to_gives es lo que YO doy.
        const recibi = row.items.from_gives.reduce((s, i) => s + i.qty, 0);
        const entregue = row.items.to_gives.reduce((s, i) => s + i.qty, 0);
        return (
          <li key={row.id} className="rounded-md border border-line bg-white p-3">
            <CardHeader row={row} />
            <TradeSummary recibi={recibi} entregue={entregue} />
            <InboxActions reqId={row.id} variant="incoming" />
          </li>
        );
      })}
    </ul>
  );
}

function EnviadasList({ items }: { items: TradeInboxRow[] }) {
  if (items.length === 0)
    return (
      <EmptyState
        title="No has enviado solicitudes"
        body="Encuentra un match en el mapa o en contactos y envía tu primera solicitud."
      />
    );
  return (
    <ul className="space-y-2">
      {items.map((row) => {
        // Enviadas: from_gives es lo que YO ofrezco (entrego), to_gives es lo que recibo del otro.
        const recibi = row.items.to_gives.reduce((s, i) => s + i.qty, 0);
        const entregue = row.items.from_gives.reduce((s, i) => s + i.qty, 0);
        return (
          <li key={row.id} className="rounded-md border border-line bg-white p-3">
            <CardHeader row={row} />
            <TradeSummary recibi={recibi} entregue={entregue} />
            <InboxActions reqId={row.id} variant="outgoing" />
          </li>
        );
      })}
    </ul>
  );
}

function AceptadasList({ items }: { items: TradeInboxRow[] }) {
  if (items.length === 0)
    return (
      <EmptyState
        title="Sin intercambios en curso"
        body="Cuando aceptes (o te acepten) una solicitud, aparecerá aquí lista para marcar como realizada."
      />
    );
  return (
    <ul className="space-y-2">
      {items.map((row) => {
        const iAmSender = row.direction === "outgoing";
        const recibi = iAmSender
          ? row.items.to_gives.reduce((s, i) => s + i.qty, 0)
          : row.items.from_gives.reduce((s, i) => s + i.qty, 0);
        const entregue = iAmSender
          ? row.items.from_gives.reduce((s, i) => s + i.qty, 0)
          : row.items.to_gives.reduce((s, i) => s + i.qty, 0);
        return (
          <li key={row.id} className="rounded-md border border-line bg-white p-3">
            <CardHeader row={row} />
            <TradeSummary recibi={recibi} entregue={entregue} />
            <InboxActions reqId={row.id} variant="accepted" />
          </li>
        );
      })}
    </ul>
  );
}

type HistorialItem = {
  id: string;
  other: { id: string; alias: string; display_name: string | null };
  items: { from_gives: { n: number; qty: number }[]; to_gives: { n: number; qty: number }[] };
  direction: "outgoing" | "incoming";
  done_at: string;
};

function HistorialList({ items }: { items: HistorialItem[] }) {
  if (items.length === 0)
    return (
      <EmptyState
        title="Aún no tienes intercambios"
        body="Cuando aceptes una solicitud y la marquéis como realizada, aparecerá aquí con el detalle."
      />
    );
  return (
    <ul className="space-y-2">
      {items.map((t) => {
        const initials = t.other.alias.slice(0, 2).toUpperCase();
        const iWasSender = t.direction === "outgoing";
        const recibi = iWasSender ? t.items.to_gives : t.items.from_gives;
        const entregue = iWasSender ? t.items.from_gives : t.items.to_gives;
        const recibiQty = recibi.reduce((s, i) => s + i.qty, 0);
        const entregueQty = entregue.reduce((s, i) => s + i.qty, 0);
        return (
          <li key={t.id} className="rounded-md border border-line bg-white p-3">
            <div className="flex items-center gap-3">
              <Link
                href={`/match/${t.other.id}`}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-green-500 font-display text-lg text-white"
              >
                {initials}
              </Link>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {t.other.display_name ?? `@${t.other.alias}`}
                </p>
                <p className="truncate text-xs text-text-2">
                  {fmtDate(t.done_at)}
                </p>
              </div>
            </div>
            <TradeSummary recibi={recibiQty} entregue={entregueQty} />
          </li>
        );
      })}
    </ul>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-line bg-white p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-text-2">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 font-display text-2xl text-text">{value}</div>
    </div>
  );
}
