"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BookMarked,
  Flag,
  MessageCircle,
  Radar,
  Send,
} from "lucide-react";
import { useNotifications } from "@/components/notifications/NotificationsRoot";

type LucideIcon = typeof BookMarked;

const TABS: ReadonlyArray<{
  id: "album" | "mapa" | "favoritos" | "chat" | "compartir";
  href: string;
  icon: LucideIcon;
}> = [
  { id: "album", href: "/album", icon: BookMarked },
  { id: "mapa", href: "/mapa", icon: Radar },
  { id: "favoritos", href: "/favoritos", icon: Flag },
  { id: "chat", href: "/chat", icon: MessageCircle },
  { id: "compartir", href: "/compartir", icon: Send },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { totalUnread, newNearbyCount, pendingTradesIn } = useNotifications();

  // Hide on chat detail (/chat/[id]) and match detail (/match/[id]) so the
  // input / sticky CTA can sit at the bottom of the viewport.
  const hide =
    /^\/(?:[a-z]{2}\/)?chat\/[^/]+/.test(pathname) ||
    /^\/(?:[a-z]{2}\/)?match\/[^/]+/.test(pathname);
  if (hide) return null;

  return (
    <nav
      aria-label="Primary"
      // En flujo normal (no position:fixed) como último hijo del flex column
      // de (app)/layout. iOS Safari calcula mal `bottom:0` cuando el layout
      // viewport difiere del visual viewport (URL bar, teclado, scroll
      // bounce) — el flex column elimina esa dependencia: la nav SIEMPRE
      // queda anclada al fondo del contenedor de altura `h-dvh`.
      style={{
        // Como en la referencia (Whistle): altura compacta fija de 52px
        // sin reservar safe-area-inset abajo. El home indicator pinta
        // sobre los últimos ~5px del nav — invisible porque queda bajo
        // los labels y iOS ya gestiona la opacidad de su pill.
        height: "52px",
      }}
      className="z-50 w-full shrink-0 border-t border-black/5 bg-white/95 backdrop-blur-xl md:hidden"
    >
      <ul className="grid h-[52px] grid-cols-5">
        {TABS.map((tab) => {
          const { id, href } = tab;
          const active =
            pathname === href || pathname.endsWith(href);
          const badge =
            id === "chat"
              ? totalUnread
              : id === "mapa"
                ? newNearbyCount
                : id === "album"
                  ? pendingTradesIn
                  : 0;
          const Icon = tab.icon;
          return (
            <li key={id}>
              <Link
                href={href}
                // Layout vertical: icono arriba, label debajo (como antes).
                // Tamaños incrementados respecto a la versión original:
                // icon 24 y label text-[11px] font-semibold.
                className={`flex h-full flex-col items-center justify-center gap-0.5 font-semibold text-[11px] leading-none tracking-tight ${
                  active ? "text-green-700" : "text-mute"
                }`}
              >
                <span className="relative shrink-0">
                  <Icon size={24} strokeWidth={2} aria-hidden />
                  {badge > 0 && (
                    <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 font-display text-[10px] leading-none text-white shadow-sh1">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
                <span className="truncate">{t(id)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
