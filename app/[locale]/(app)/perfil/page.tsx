import Link from "next/link";
import { ChevronRight, Crown, LogOut, Pencil } from "lucide-react";
import { TOTAL_STICKERS } from "@/lib/data/stickers";
import { signOut } from "@/lib/auth/actions";
import { Btn } from "@/components/ui/Btn";
import { createClient } from "@/lib/supabase/server";
import { ProfileSettings } from "@/components/profile/ProfileSettings";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: userStickers }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, alias, display_name, avatar_url, color, plan, rating, trades_count, locale",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("user_stickers")
      .select("count")
      .eq("user_id", user.id)
      .gte("count", 1),
  ]);

  let owned = 0;
  let repes = 0;
  for (const row of userStickers ?? []) {
    if (row.count >= 1) owned++;
    if (row.count >= 2) repes += row.count - 1;
  }
  const pct = owned > 0 ? (owned / TOTAL_STICKERS) * 100 : 0;
  const missing = TOTAL_STICKERS - owned;
  const initials = (profile?.alias ?? user.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <main className="px-5 pb-6 pt-14">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-tight">Perfil</h1>
        <Link
          href="/perfil/editar"
          className="grid h-10 w-10 place-items-center rounded-md border border-line bg-white"
          aria-label="Editar perfil"
        >
          <Pencil size={16} strokeWidth={2} />
        </Link>
      </div>

      <section className="mt-5 flex flex-col items-center">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.alias ?? ""}
            className="h-20 w-20 rounded-full object-cover shadow-sh2"
          />
        ) : (
          <div
            className="grid h-20 w-20 place-items-center rounded-full font-display text-3xl text-white shadow-sh2"
            style={{ background: profile?.color ?? "#1FAE5A" }}
          >
            {initials}
          </div>
        )}
        <h2 className="mt-3 font-display text-2xl">
          {profile?.display_name || profile?.alias || "anónimo"}
        </h2>
        <p className="text-sm text-text-2">@{profile?.alias ?? "—"}</p>
        <p className="mt-1 text-xs text-text-2">
          ★ {profile?.rating ?? "—"} · {profile?.trades_count ?? 0} intercambios
        </p>
      </section>

      <section className="mt-5 rounded-md border border-line bg-white p-4">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-3xl">{owned}</span>
            <span className="font-display text-lg text-text-2">/{TOTAL_STICKERS}</span>
          </div>
          <span className="font-display text-2xl text-green-700">
            {pct.toFixed(1)}%
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-green-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-3 flex justify-around border-t border-line pt-3 text-center text-xs">
          <div>
            <div className="font-display text-lg">{repes}</div>
            <div className="text-text-2">Repetidas</div>
          </div>
          <div>
            <div className="font-display text-lg">{missing}</div>
            <div className="text-text-2">Faltan</div>
          </div>
          <div>
            <div className="font-display text-lg">{profile?.trades_count ?? 0}</div>
            <div className="text-text-2">Cambios</div>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-md border border-gold/30 bg-gradient-to-br from-ink to-charcoal p-4 text-white">
        <div className="flex items-center gap-2">
          <Crown size={20} className="text-gold" strokeWidth={2} />
          <h3 className="font-display text-lg text-gold-light">Cromio Pro</h3>
        </div>
        <p className="mt-1.5 text-sm text-white/70">
          Próximamente — radio ampliado, chat sin límite y marketplace.
        </p>
        <Btn kind="pro" size="sm" className="mt-3" disabled>
          Próximamente
        </Btn>
      </section>

      <ProfileSettings />

      <section className="mt-5 divide-y divide-line rounded-md border border-line bg-white">
        <Link
          href="/perfil/intercambios"
          className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm"
        >
          <span>Mis intercambios</span>
          <ChevronRight size={16} className="text-text-2" />
        </Link>
        <Link
          href="/perfil/lista-deseos"
          className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm"
        >
          <span>Lista de deseos</span>
          <ChevronRight size={16} className="text-text-2" />
        </Link>
        <Link
          href="/perfil/bloqueos"
          className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm"
        >
          <span>Bloqueos</span>
          <ChevronRight size={16} className="text-text-2" />
        </Link>
      </section>

      <section className="mt-5 divide-y divide-line rounded-md border border-line bg-white">
        {(
          [
            { href: "/sobre", label: "Sobre Cromio" },
            { href: "/terminos", label: "Términos y condiciones" },
            { href: "/privacidad", label: "Política de privacidad" },
          ] as const
        ).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm"
          >
            <span>{item.label}</span>
            <ChevronRight size={16} className="text-text-2" />
          </Link>
        ))}
      </section>

      <form action={signOut}>
        <button
          type="submit"
          className="mt-5 flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold text-text-2"
        >
          <LogOut size={16} /> Cerrar sesión
        </button>
      </form>

      <p className="mt-6 text-center text-[10px] text-mute">
        App no oficial · No afiliada con Panini Group ni FIFA.
      </p>
    </main>
  );
}
