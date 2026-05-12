"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import {
  BookMarked,
  Flag,
  MessageCircle,
  User,
} from "lucide-react";
import { useNotifications } from "@/components/notifications/NotificationsRoot";

type LucideIcon = typeof BookMarked;

const TABS: ReadonlyArray<{
  id: "album" | "mapa" | "favoritos" | "chat" | "perfil";
  href: string;
  icon: LucideIcon | "radar";
}> = [
  { id: "album", href: "/album", icon: BookMarked },
  { id: "mapa", href: "/mapa", icon: "radar" },
  { id: "favoritos", href: "/favoritos", icon: Flag },
  { id: "chat", href: "/chat", icon: MessageCircle },
  { id: "perfil", href: "/perfil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { totalUnread, newNearbyCount } = useNotifications();
  const navRef = useRef<HTMLElement | null>(null);

  // iOS Safari bug: con position:fixed + bottom:0, cuando la URL bar
  // colapsa/expande o aparece el teclado, el visualViewport cambia pero el
  // elemento fixed se queda anclado al LAYOUT viewport — eso produce el
  // "hueco" abajo que el usuario reporta de rato en rato. Compensamos con
  // un translateY basado en la diferencia entre layout y visual viewport.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;
    const el = navRef.current;
    if (!el) return;

    let raf = 0;
    const apply = () => {
      raf = 0;
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      el.style.transform = offset > 0.5 ? `translateY(-${offset}px)` : "";
    };
    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(apply);
    };

    apply();
    vv.addEventListener("resize", schedule);
    vv.addEventListener("scroll", schedule);
    window.addEventListener("orientationchange", schedule);
    return () => {
      vv.removeEventListener("resize", schedule);
      vv.removeEventListener("scroll", schedule);
      window.removeEventListener("orientationchange", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Hide on chat detail (/chat/[id]) and match detail (/match/[id]) so the
  // input / sticky CTA can sit at the bottom of the viewport.
  const hide =
    /^\/(?:[a-z]{2}\/)?chat\/[^/]+/.test(pathname) ||
    /^\/(?:[a-z]{2}\/)?match\/[^/]+/.test(pathname);
  if (hide) return null;

  return (
    <nav
      ref={navRef}
      aria-label="Primary"
      // Altura fija (incluye safe-area) para que la barra nunca cambie de
      // tamaño entre rutas. La posición real la corrige el efecto de
      // visualViewport arriba — bottom:0 es el ancla; translateY compensa
      // cuando iOS Safari deja gap entre el layout y el visual viewport.
      style={{
        height: "calc(58px + env(safe-area-inset-bottom))",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[430px] border-t border-black/5 bg-white/90 backdrop-blur-xl md:hidden"
    >
      <ul className="grid h-[58px] grid-cols-5">
        {TABS.map((tab) => {
          const { id, href } = tab;
          const active =
            pathname === href || pathname.endsWith(href);
          const badge =
            id === "chat"
              ? totalUnread
              : id === "mapa"
                ? newNearbyCount
                : 0;
          const Icon = tab.icon;
          return (
            <li key={id}>
              <Link
                href={href}
                // Sin cambio de font-weight ni strokeWidth entre estados:
                // ambas cosas producen layout shift sub-pixel en glyph y
                // path width, suficiente para que el ojo perciba la barra
                // "lifteando" al cambiar de tab. Usamos solo color para
                // distinguir activo de inactivo.
                className={`flex h-full flex-col items-center justify-center gap-0.5 font-medium text-[10px] leading-none tracking-wide ${
                  active ? "text-text" : "text-mute"
                }`}
              >
                <span className="relative">
                  {Icon === "radar" ? (
                    <Image
                      src="/radar.png"
                      alt=""
                      width={22}
                      height={22}
                      aria-hidden
                      className={active ? "" : "opacity-70"}
                    />
                  ) : (
                    <Icon size={22} strokeWidth={2} aria-hidden />
                  )}
                  {badge > 0 && (
                    <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 font-display text-[10px] leading-none text-white shadow-sh1">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
                <span>{t(id)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
