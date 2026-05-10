"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/Logo";
import {
  BookMarked,
  Compass,
  Flag,
  MessageCircle,
  User,
} from "lucide-react";
import { useNotifications } from "@/components/notifications/NotificationsRoot";

const TABS = [
  { id: "album", href: "/album", icon: BookMarked },
  { id: "mapa", href: "/mapa", icon: Compass },
  { id: "favoritos", href: "/favoritos", icon: Flag },
  { id: "chat", href: "/chat", icon: MessageCircle },
  { id: "perfil", href: "/perfil", icon: User },
] as const;

export function SideNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { totalUnread, newNearbyCount } = useNotifications();

  return (
    <aside
      aria-label="Primary"
      className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r border-line bg-white px-4 py-6 md:block"
    >
      <Link href="/album" aria-label="Cromio · ir al álbum" className="mb-6 block px-2">
        <Logo size="md" />
      </Link>
      <ul className="space-y-1">
        {TABS.map(({ id, href, icon: Icon }) => {
          const active = pathname === href || pathname.endsWith(href);
          const badge =
            id === "chat"
              ? totalUnread
              : id === "mapa"
                ? newNearbyCount
                : 0;
          return (
            <li key={id}>
              <Link
                href={href}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-green-50 font-bold text-green-700"
                    : "font-medium text-text-2 hover:bg-paper hover:text-text"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                <span className="flex-1 capitalize">{t(id)}</span>
                {badge > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1.5 font-display text-[11px] leading-none text-white">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
