"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";

/**
 * Cabecera sticky compartida por todas las páginas de (app).
 *
 * Estructura:
 *   [Cromio logo] · Título · [acciones?] · [tuerca → /perfil]
 *
 * - sticky top-0: queda fija mientras el contenido scrollea (el
 *   scroll vive en el wrapper flex-1 overflow-y-auto del layout, así
 *   que sticky se ancla a su límite superior).
 * - z-30: sobre el contenido, debajo de toasts (z-100).
 * - El icono de tuerca lleva a /perfil (sustituye el tab Perfil del
 *   BottomNav). En la propia /perfil se oculta.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const onPerfil = /^\/(?:[a-z]{2}\/)?perfil(?:\/|$)/.test(pathname);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-line bg-bone/95 px-5 pb-3 pt-14 backdrop-blur-xl">
      <div className="flex items-center gap-2.5">
        <Link
          href="/album"
          aria-label="Inicio"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-green-500 shadow-sh1"
        >
          <Image
            src="/radar_cromio.png"
            alt=""
            width={22}
            height={22}
            priority
          />
        </Link>
        <h1 className="flex-1 truncate font-display text-2xl tracking-tight">
          {title}
        </h1>
        {actions}
        {!onPerfil && (
          <Link
            href="/perfil"
            aria-label="Perfil y ajustes"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-line bg-white text-text-2 shadow-sh1"
          >
            <Settings size={17} strokeWidth={2.2} />
          </Link>
        )}
      </div>
      {subtitle && (
        <div className="mt-1 text-xs uppercase tracking-wider text-text-2">
          {subtitle}
        </div>
      )}
    </header>
  );
}
