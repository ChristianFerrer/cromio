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
      className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[430px] border-t border-black/5 bg-white/90 pb-[max(env(safe-area-inset-bottom),12px)] pt-1.5 backdrop-blur-xl md:hidden"
    >
      <ul className="grid grid-cols-5">
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
                className={`flex flex-col items-center gap-0.5 py-1.5 text-[10px] tracking-wide transition-colors ${
                  active
                    ? "font-bold text-text"
                    : "font-medium text-mute"
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
                    <Icon
                      size={22}
                      strokeWidth={active ? 2.2 : 1.8}
                      aria-hidden
                    />
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
