"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { MOCK_USERS } from "@/lib/data/mock-users";
import { buildMockCollection } from "@/lib/data/stickers";
import { AlbumProgress } from "@/components/match/AlbumProgress";

const MOCK_CHATS = [
  {
    id: "ch_maria",
    userId: "u_maria",
    state: "pending" as const,
    last: "Quedamos mañana en Plaça Reial?",
    time: "14:22",
    unread: 2,
  },
  {
    id: "ch_carlos",
    userId: "u_carlos",
    state: "confirmed" as const,
    last: "✓ Quedada confirmada · sábado 11:00",
    time: "12:08",
    unread: 0,
  },
  {
    id: "ch_pedro",
    userId: "u_pedro",
    state: "completed" as const,
    last: "⭐ Intercambio completado",
    time: "Ayer",
    unread: 0,
  },
];

const STATE_COLORS = {
  pending: "bg-gold/15 text-gold-dark",
  confirmed: "bg-green-100 text-green-700",
  completed: "bg-line text-text-2",
} as const;

export default function ChatListPage() {
  return (
    <main className="px-5 pb-6 pt-14">
      <h1 className="font-display text-3xl tracking-tight">Chats</h1>
      <p className="mt-1 text-xs uppercase tracking-wider text-text-2">
        {MOCK_CHATS.length} conversaciones
      </p>

      <div className="mt-5 space-y-2">
        {MOCK_CHATS.map((c) => {
          const u = MOCK_USERS.find((x) => x.id === c.userId);
          if (!u) return null;
          const map = buildMockCollection(MOCK_USERS.indexOf(u) + 1);
          let owned = 0;
          map.forEach((cnt) => cnt >= 1 && owned++);
          const pct = Math.round((owned / map.size) * 1000) / 10;
          return (
            <Link
              key={c.id}
              href={`/chat/${c.id}`}
              className="flex items-center gap-3 rounded-md border border-line bg-white p-3"
            >
              <div className="relative">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-green-500 font-display text-lg text-white">
                  {u.alias.slice(0, 2).toUpperCase()}
                </div>
                {c.unread > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-green-500 text-[10px] font-bold text-white ring-2 ring-white">
                    {c.unread}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-bold">{u.alias}</span>
                  <span className="shrink-0 text-[11px] text-text-2">{c.time}</span>
                </div>
                <span
                  className={`mt-1 inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATE_COLORS[c.state]}`}
                >
                  {c.state === "pending" ? "Pendiente" : c.state === "confirmed" ? "Confirmado" : "Completado"}
                </span>
                <p className="mt-1 truncate text-xs text-text-2">{c.last}</p>
                <AlbumProgress pct={pct} className="mt-1.5" />
              </div>
            </Link>
          );
        })}
        {MOCK_CHATS.length === 0 && (
          <div className="grid h-48 place-items-center rounded-md border border-dashed border-line text-center text-sm text-text-2">
            <MessageCircle size={28} className="mx-auto mb-2 text-mute" />
            Sin conversaciones todavía
          </div>
        )}
      </div>
    </main>
  );
}
