import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowDown, ArrowUp, CheckCircle2, ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { loadCompletedTradesForCurrentUser } from "@/lib/trades/queries";
import { IconLink } from "@/components/ui/IconBtn";

export default async function IntercambiosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trades = await loadCompletedTradesForCurrentUser();

  // Total cromos moved across all my closed trades — a nicer signal than "N
  // trades" because some trades involve more cromos than others.
  let totalCromos = 0;
  for (const t of trades) {
    totalCromos += t.items.from_gives.reduce((s, i) => s + (i.qty ?? 0), 0);
    totalCromos += t.items.to_gives.reduce((s, i) => s + (i.qty ?? 0), 0);
  }

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
          value={trades.length.toString()}
          icon={<CheckCircle2 size={16} strokeWidth={2.2} className="text-green-700" />}
        />
        <Stat
          label="Cromos movidos"
          value={totalCromos.toString()}
          icon={<ArrowDown size={16} strokeWidth={2.2} className="text-text-2" />}
        />
      </div>

      {trades.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-line bg-gradient-to-b from-paper to-bone px-6 py-10 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-green-100 text-green-700">
            <CheckCircle2 size={22} strokeWidth={2.2} />
          </div>
          <h2 className="mt-3 font-display text-lg">Aún no tienes intercambios</h2>
          <p className="mt-1 max-w-xs text-xs leading-snug text-text-2">
            Cuando aceptes una solicitud y la marquéis como realizada, aparecerá
            aquí con el detalle de los cromos.
          </p>
          <Link
            href="/mapa"
            className="mt-4 rounded-md bg-green-500 px-4 py-2.5 text-xs font-bold text-white shadow-sh1"
          >
            Buscar coleccionistas
          </Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-2">
          {trades.map((t) => {
            const u = t.other;
            const initials = u.alias.slice(0, 2).toUpperCase();
            const when = new Date(t.done_at).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            // Normalise to my POV: what I received vs what I gave.
            const iWasSender = t.direction === "outgoing";
            const recibi = iWasSender ? t.items.to_gives : t.items.from_gives;
            const entregue = iWasSender ? t.items.from_gives : t.items.to_gives;
            const recibiQty = recibi.reduce((s, i) => s + i.qty, 0);
            const entregueQty = entregue.reduce((s, i) => s + i.qty, 0);
            return (
              <li key={t.id} className="rounded-md border border-line bg-white p-3">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/match/${u.id}`}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-green-500 font-display text-lg text-white"
                  >
                    {initials}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {u.display_name ?? `@${u.alias}`}
                    </p>
                    <p className="truncate text-xs text-text-2">{when}</p>
                  </div>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center justify-between rounded bg-paper px-2.5 py-1.5">
                    <span className="inline-flex items-center gap-1 text-text-2">
                      <ArrowDown size={11} strokeWidth={2.6} className="text-green-700" />
                      Recibí
                    </span>
                    <span className="font-display text-base text-text">{recibiQty}</span>
                  </div>
                  <div className="flex items-center justify-between rounded bg-paper px-2.5 py-1.5">
                    <span className="inline-flex items-center gap-1 text-text-2">
                      <ArrowUp size={11} strokeWidth={2.6} className="text-red-600" />
                      Entregué
                    </span>
                    <span className="font-display text-base text-text">{entregueQty}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
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
