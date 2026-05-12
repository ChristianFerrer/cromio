"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
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

  // Hide on chat detail (/chat/[id]) and match detail (/match/[id]) so the
  // input / sticky CTA can sit at the bottom of the viewport.
  const hide =
    /^\/(?:[a-z]{2}\/)?chat\/[^/]+/.test(pathname) ||
    /^\/(?:[a-z]{2}\/)?match\/[^/]+/.test(pathname);
  if (hide) return null;

  return (
    <nav
      aria-label="Primary"
      // Altura fija (incluye safe-area) para que la barra nunca cambie de
      // tamaño entre rutas: clave para que el menú "no se suba" cuando
      // navegas en iOS Safari (donde la URL bar al colapsarse cambia el
      // viewport y, si el padding depende de eso, la barra parece moverse).
      // Hacemos: una franja fija en altura física, con safe-area DENTRO.
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
