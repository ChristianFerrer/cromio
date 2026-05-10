"use client";

import Link from "next/link";
import { Settings, Crown, ChevronRight, LogOut, LogIn } from "lucide-react";
import { useCollection } from "@/hooks/useCollection";
import { useUser } from "@/hooks/useUser";
import { TOTAL_STICKERS } from "@/lib/data/stickers";
import { signOut } from "@/lib/auth/actions";
import { Btn } from "@/components/ui/Btn";

export default function PerfilPage() {
  const { stats } = useCollection();
  const { user, loading } = useUser();

  const initial = user?.email?.[0]?.toUpperCase() ?? "T";
  const alias = user?.email?.split("@")[0] ?? "anónimo";

  return (
    <main className="px-5 pb-6 pt-14">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-tight">Perfil</h1>
        <button className="grid h-10 w-10 place-items-center rounded-md border border-line bg-white">
          <Settings size={18} strokeWidth={1.8} />
        </button>
      </div>

      <section className="mt-5 flex flex-col items-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-green-500 font-display text-3xl text-white shadow-sh2">
          {initial}
        </div>
        <h2 className="mt-3 font-display text-2xl">{alias}</h2>
        <p className="text-sm text-text-2">
          {user ? user.email : "Sin sesión iniciada"}
        </p>
      </section>

      {!user && !loading && (
        <section className="mt-5 rounded-md border border-green-100 bg-green-50 p-4 text-center">
          <h3 className="font-bold text-green-700">Inicia sesión para guardar tus cromos</h3>
          <p className="mt-1 text-xs text-text-2">
            Sin cuenta tu colección vive solo en este navegador.
          </p>
          <div className="mt-3 flex gap-2">
            <Btn kind="primaryVibrant" size="sm" full className="!h-10 !text-sm" icon={<LogIn size={14} />}>
              <Link href="/login">Iniciar sesión</Link>
            </Btn>
            <Btn kind="ghost" size="sm" full className="!h-10 !text-sm">
              <Link href="/signup">Crear cuenta</Link>
            </Btn>
          </div>
        </section>
      )}

      <section className="mt-5 rounded-md border border-line bg-white p-4">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-3xl">{stats.owned}</span>
            <span className="font-display text-lg text-text-2">/{TOTAL_STICKERS}</span>
          </div>
          <span className="font-display text-2xl text-green-700">
            {stats.pct.toFixed(1)}%
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-green-500"
            style={{ width: `${stats.pct}%` }}
          />
        </div>
        <div className="mt-3 flex justify-around border-t border-line pt-3 text-center text-xs">
          <div>
            <div className="font-display text-lg">{stats.repes}</div>
            <div className="text-text-2">Repes</div>
          </div>
          <div>
            <div className="font-display text-lg">{stats.missing}</div>
            <div className="text-text-2">Faltan</div>
          </div>
          <div>
            <div className="font-display text-lg">0</div>
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

      <section className="mt-5 divide-y divide-line rounded-md border border-line bg-white">
        {[
          "Datos personales",
          "Notificaciones",
          "Privacidad",
          "Términos y condiciones",
          "Sobre Cromio",
        ].map((item) => (
          <button
            key={item}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm"
          >
            <span>{item}</span>
            <ChevronRight size={16} className="text-text-2" />
          </button>
        ))}
      </section>

      {user && (
        <form action={signOut}>
          <button
            type="submit"
            className="mt-5 flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold text-text-2"
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-[10px] text-mute">
        App no oficial · No afiliada con Panini Group ni FIFA.
      </p>
    </main>
  );
}
