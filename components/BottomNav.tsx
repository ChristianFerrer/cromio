"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BookMarked,
  Compass,
  Flag,
  MessageCircle,
  User,
} from "lucide-react";

const TABS = [
  { id: "album", href: "/album", icon: BookMarked },
  { id: "mapa", href: "/mapa", icon: Compass },
  { id: "favoritos", href: "/favoritos", icon: Flag },
  { id: "chat", href: "/chat", icon: MessageCircle },
  { id: "perfil", href: "/perfil", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[430px] border-t border-black/5 bg-white/90 pb-[max(env(safe-area-inset-bottom),12px)] pt-1.5 backdrop-blur-xl"
    >
      <ul className="grid grid-cols-5">
        {TABS.map(({ id, href, icon: Icon }) => {
          const active =
            pathname === href || pathname.endsWith(href);
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
                <Icon
                  size={22}
                  strokeWidth={active ? 2.2 : 1.8}
                  aria-hidden
                />
                <span>{t(id)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
