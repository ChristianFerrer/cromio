import Link from "next/link";
import { LogIn, MessageCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/profile";
import { loadChatsForCurrentUser } from "@/lib/chat/queries";

function formatChatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return "Ayer";
  const diffDays = Math.round((now.getTime() - d.getTime()) / 86400000);
  if (diffDays < 7) {
    return d.toLocaleDateString("es-ES", { weekday: "short" });
  }
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: now.getFullYear() === d.getFullYear() ? undefined : "numeric",
  });
}

export default async function ChatListPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="px-5 pb-6 pt-14">
        <h1 className="font-display text-3xl tracking-tight">Chats</h1>
        <div className="mt-10 flex flex-col items-center gap-3 rounded-md border border-dashed border-line bg-paper px-5 py-10 text-center">
          <MessageCircle size={32} className="text-mute" />
          <p className="text-sm text-text-2">
            Inicia sesión para chatear con otros coleccionistas y coordinar intercambios.
          </p>
          <Link
            href="/login"
            className="mt-2 inline-flex items-center gap-2 rounded-md bg-green-500 px-5 py-2 text-sm font-bold text-white"
          >
            <LogIn size={14} /> Iniciar sesión
          </Link>
        </div>
      </main>
    );
  }

  const chats = await loadChatsForCurrentUser();

  return (
    <main className="px-5 pb-6 pt-14">
      <h1 className="font-display text-3xl tracking-tight">Chats</h1>
      <p className="mt-1 text-xs uppercase tracking-wider text-text-2">
        {chats.length} {chats.length === 1 ? "conversación" : "conversaciones"}
      </p>

      {chats.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-line bg-gradient-to-b from-paper to-bone px-6 py-10 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-green-500 to-green-700 text-white shadow-sh2">
            <MessageCircle size={28} strokeWidth={2} />
          </div>
          <h2 className="mt-4 font-display text-xl">Aún no tienes chats</h2>
          <p className="mt-1 max-w-xs text-xs leading-snug text-text-2">
            Cuando encuentres un coleccionista con cromos que te interesen, abre
            una conversación desde su perfil para coordinar el intercambio.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/mapa"
              className="rounded-md bg-green-500 px-4 py-2.5 text-xs font-bold text-white shadow-sh1"
            >
              Buscar coleccionistas en el mapa
            </Link>
            <Link
              href="/album"
              className="rounded-md border border-line bg-white px-4 py-2.5 text-xs font-semibold"
            >
              Añadir más cromos
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          {chats.map((c) => {
            const initials = (c.other_user.alias ?? "??").slice(0, 2).toUpperCase();
            const time = formatChatTime(c.last_message_at);
            const stateLabel =
              c.state === "pending"
                ? "Pendiente"
                : c.state === "confirmed"
                  ? "Confirmado"
                  : c.state === "completed"
                    ? "Completado"
                    : "Cancelado";
            const stateClass =
              c.state === "pending"
                ? "bg-gold/15 text-gold-dark"
                : c.state === "confirmed"
                  ? "bg-green-100 text-green-700"
                  : "bg-line text-text-2";

            return (
              <Link
                key={c.id}
                href={`/chat/${c.id}`}
                className="flex items-center gap-3 rounded-md border border-line bg-white p-3"
              >
                <div className="relative">
                  <div
                    className="grid h-12 w-12 place-items-center rounded-full font-display text-lg text-white"
                    style={{ background: c.other_user.color ?? "#1FAE5A" }}
                  >
                    {initials}
                  </div>
                  {c.unread_count > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-green-500 text-[10px] font-bold text-white ring-2 ring-white">
                      {c.unread_count}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-bold">
                      {c.other_user.display_name ?? c.other_user.alias}
                    </span>
                    {time && <span className="shrink-0 text-[11px] text-text-2">{time}</span>}
                  </div>
                  <span
                    className={`mt-1 inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${stateClass}`}
                  >
                    {stateLabel}
                  </span>
                  <p className="mt-1 truncate text-xs text-text-2">
                    {c.last_message?.body ?? "Sin mensajes todavía"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
