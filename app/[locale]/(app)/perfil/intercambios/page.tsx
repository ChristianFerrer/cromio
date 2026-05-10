import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CheckCircle2, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { IconLink } from "@/components/ui/IconBtn";

type CompletedChat = {
  id: string;
  user_a: string;
  user_b: string;
  meeting_place: string | null;
  meeting_at: string | null;
  last_message_at: string | null;
  other: {
    id: string;
    alias: string;
    display_name: string | null;
    color: string | null;
  } | null;
  myStars: number | null;
  theirStars: number | null;
};

export default async function IntercambiosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: chats } = await supabase
    .from("chats")
    .select(
      `id, user_a, user_b, meeting_place, meeting_at, last_message_at,
       a:profiles!chats_user_a_fkey (id, alias, display_name, color),
       b:profiles!chats_user_b_fkey (id, alias, display_name, color)`,
    )
    .eq("state", "completed")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order("meeting_at", { ascending: false, nullsFirst: false });

  const ids = (chats ?? []).map((c) => c.id);
  const ratings = ids.length
    ? (
        await supabase
          .from("chat_ratings")
          .select("chat_id, rater_id, stars, note")
          .in("chat_id", ids)
      ).data ?? []
    : [];

  type RatingRow = { chat_id: string; rater_id: string; stars: number; note: string | null };
  const ratingsByChat = new Map<string, RatingRow[]>();
  for (const r of ratings as RatingRow[]) {
    if (!ratingsByChat.has(r.chat_id)) ratingsByChat.set(r.chat_id, []);
    ratingsByChat.get(r.chat_id)!.push(r);
  }

  const rows: CompletedChat[] = (chats ?? []).map((c) => {
    const otherRaw = (c.user_a === user.id ? c.b : c.a) as
      | CompletedChat["other"]
      | CompletedChat["other"][];
    const other = Array.isArray(otherRaw) ? otherRaw[0] ?? null : otherRaw;
    const rs = ratingsByChat.get(c.id) ?? [];
    const myStars = rs.find((r) => r.rater_id === user.id)?.stars ?? null;
    const theirStars = rs.find((r) => r.rater_id !== user.id)?.stars ?? null;
    return {
      id: c.id,
      user_a: c.user_a,
      user_b: c.user_b,
      meeting_place: c.meeting_place,
      meeting_at: c.meeting_at,
      last_message_at: c.last_message_at,
      other,
      myStars,
      theirStars,
    };
  });

  const avgReceived =
    rows.filter((r) => r.theirStars != null).length === 0
      ? null
      : rows
          .filter((r) => r.theirStars != null)
          .reduce((s, r) => s + (r.theirStars ?? 0), 0) /
        rows.filter((r) => r.theirStars != null).length;

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
          value={rows.length.toString()}
          icon={<CheckCircle2 size={16} strokeWidth={2.2} className="text-green-700" />}
        />
        <Stat
          label="Recibido"
          value={avgReceived == null ? "—" : `${avgReceived.toFixed(1)} ★`}
          icon={<Star size={16} strokeWidth={2.2} className="text-gold" fill="currentColor" />}
        />
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-line bg-gradient-to-b from-paper to-bone px-6 py-10 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-green-100 text-green-700">
            <CheckCircle2 size={22} strokeWidth={2.2} />
          </div>
          <h2 className="mt-3 font-display text-lg">Aún no tienes intercambios</h2>
          <p className="mt-1 max-w-xs text-xs leading-snug text-text-2">
            Cuando cierres una quedada y la marques como "Hecho", aparecerá aquí
            con las valoraciones de ambos lados.
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
          {rows.map((r) => {
            const u = r.other;
            if (!u) return null;
            const initials = u.alias.slice(0, 2).toUpperCase();
            const when = r.meeting_at
              ? new Date(r.meeting_at).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Sin fecha";
            return (
              <li
                key={r.id}
                className="rounded-md border border-line bg-white p-3"
              >
                <div className="flex items-center gap-3">
                  <Link
                    href={`/match/${u.id}`}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-lg text-white"
                    style={{ background: u.color ?? "#1FAE5A" }}
                  >
                    {initials}
                  </Link>
                  <Link href={`/chat/${r.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {u.display_name ?? `@${u.alias}`}
                    </p>
                    <p className="truncate text-xs text-text-2">
                      {when}
                      {r.meeting_place ? ` · ${r.meeting_place}` : ""}
                    </p>
                  </Link>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px]">
                  <RatingPill
                    label="Tu valoración"
                    stars={r.myStars}
                    cta={
                      r.myStars == null ? (
                        <Link
                          href={`/chat/${r.id}`}
                          className="rounded bg-green-500 px-2 py-0.5 font-bold text-white"
                        >
                          Valorar
                        </Link>
                      ) : null
                    }
                  />
                  <RatingPill label="Te valoraron" stars={r.theirStars} />
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

function RatingPill({
  label,
  stars,
  cta,
}: {
  label: string;
  stars: number | null;
  cta?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded bg-paper px-2.5 py-1.5">
      <span className="truncate text-text-2">{label}</span>
      <span className="flex shrink-0 items-center gap-1 text-text">
        {stars == null ? (
          cta ?? <span className="text-text-2">—</span>
        ) : (
          <>
            <Star size={11} strokeWidth={2.2} fill="currentColor" className="text-gold" />
            <span className="font-display">{stars}</span>
          </>
        )}
      </span>
    </div>
  );
}
