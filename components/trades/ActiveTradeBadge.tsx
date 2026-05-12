"use client";

import { ArrowLeftRight } from "lucide-react";
import { useNotifications } from "@/components/notifications/NotificationsRoot";

// Tiny vertical-swap glyph in a green pill, shown next to a username
// when there's a pending or accepted trade with that user. Used in
// /favoritos and /chat list rows.
export function ActiveTradeBadge({ userId }: { userId: string }) {
  const { activeTradeWithUsers } = useNotifications();
  if (!activeTradeWithUsers.has(userId)) return null;
  return (
    <span
      aria-label="Intercambio activo"
      className="grid h-4 w-4 place-items-center rounded-full bg-green-100 text-green-700"
    >
      <ArrowLeftRight
        size={9}
        strokeWidth={2.4}
        style={{ transform: "rotate(90deg)" }}
      />
    </span>
  );
}
