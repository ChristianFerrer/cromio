"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/Logo";
import {
  BookMarked,
  Flag,
  MessageCircle,
  ShieldCheck,
  User,
} from "lucide-react";
import { useNotifications } from "@/components/notifications/NotificationsRoot";
import { useUser } from "@/hooks/useUser";

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

export function SideNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { totalUnread, newNearbyCount } = useNotifications();
  const { isAdmin } = useUser();

  return (
    <aside
      aria-label="Primary"
      className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r border-line bg-white px-4 py-6 md:block"
    >
      <Link href="/album" aria-label="Cromio · ir al álbum" className="mb-6 block px-2">
        <Logo size="md" />
      </Link>
      <ul className="space-y-1">
        {TABS.map((tab) => {
          const { id, href } = tab;
          const active = pathname === href || pathname.endsWith(href);
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
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-green-50 font-bold text-green-700"
                    : "font-medium text-text-2 hover:bg-paper hover:text-text"
                }`}
              >
                {Icon === "radar" ? (
                  <Image
                    src="/radar.png"
                    alt=""
                    width={20}
                    height={20}
                    aria-hidden
                    className={active ? "" : "opacity-70"}
                  />
                ) : (
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                )}
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
        {isAdmin && (
          <li>
            <Link
              href="/admin/dashboard"
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                pathname.startsWith("/admin")
                  ? "bg-green-50 font-bold text-green-700"
                  : "font-medium text-text-2 hover:bg-paper hover:text-text"
              }`}
            >
              <ShieldCheck
                size={20}
                strokeWidth={pathname.startsWith("/admin") ? 2.2 : 1.8}
                aria-hidden
              />
              <span className="flex-1 capitalize">{t("admin")}</span>
            </Link>
          </li>
        )}
      </ul>
    </aside>
  );
}
