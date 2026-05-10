"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { unblockUser } from "@/lib/moderation/actions";
import { pushAppToast } from "@/lib/notifications/toast";

type Block = {
  blocked_id: string;
  created_at: string;
  blocked: {
    id: string;
    alias: string;
    display_name: string | null;
    avatar_url: string | null;
    color: string | null;
  } | null;
};

export function BlocksList({ rows: initial }: { rows: Block[] }) {
  const [rows, setRows] = useState(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const onUnblock = (id: string, alias: string) => {
    if (!window.confirm(`¿Desbloquear a @${alias}?`)) return;
    setPendingId(id);
    startTransition(async () => {
      const r = await unblockUser(id);
      setPendingId(null);
      if (r?.error) {
        pushAppToast({ kind: "error", body: "No se pudo desbloquear." });
        return;
      }
      setRows((prev) => prev.filter((row) => row.blocked_id !== id));
      pushAppToast({
        kind: "info",
        body: `@${alias} ya puede aparecer en tu mapa de nuevo.`,
      });
    });
  };

  return (
    <ul className="mt-5 space-y-2">
      {rows.map((row) => {
        const u = row.blocked;
        if (!u) return null;
        const initials = (u.alias ?? "??").slice(0, 2).toUpperCase();
        const since = new Date(row.created_at).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        return (
          <li
            key={row.blocked_id}
            className="flex items-center gap-3 rounded-md border border-line bg-white p-3"
          >
            <Link
              href={`/match/${u.id}`}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-lg text-white"
              style={{ background: u.color ?? "#1FAE5A" }}
              aria-label={`Abrir perfil de ${u.alias}`}
            >
              {initials}
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">@{u.alias}</p>
              {u.display_name && (
                <p className="truncate text-xs text-text-2">{u.display_name}</p>
              )}
              <p className="mt-0.5 text-[11px] text-text-2">Bloqueado el {since}</p>
            </div>
            <button
              type="button"
              onClick={() => onUnblock(u.id, u.alias)}
              disabled={pendingId === u.id}
              className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-text-2 hover:bg-paper disabled:opacity-50"
            >
              <ShieldOff size={12} strokeWidth={2.2} /> Desbloquear
            </button>
          </li>
        );
      })}
    </ul>
  );
}
