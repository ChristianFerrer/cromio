"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  CheckCheck,
  ChevronLeft,
  Clock,
  Send,
} from "lucide-react";
import type { ChatMessage } from "@/lib/chat/queries";
import { sendMessage, markChatRead } from "@/lib/chat/actions";
import { createClient } from "@/lib/supabase/client";
import { pushAppToast } from "@/lib/notifications/toast";
import { IconBtn, IconLink } from "@/components/ui/IconBtn";
import { CromoPreviewSheet } from "@/components/cromo/CromoPreviewSheet";
import { TOTAL_STICKERS } from "@/lib/data/stickers";

type Other = {
  id: string;
  alias: string;
  display_name: string | null;
  avatar_url: string | null;
  color: string | null;
  rating: number | null;
  trades_count: number | null;
};

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function formatDayLabel(ts: string) {
  const d = new Date(ts);
  const today = startOfDay(new Date());
  const that = startOfDay(d);
  const diffDays = Math.round((today - that) / 86400000);
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return d.toLocaleDateString("es-ES", { weekday: "long" });
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: today - that > 365 * 86400000 ? "numeric" : undefined,
  });
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatRoom({
  chatId,
  meId,
  other,
  initialMessages,
}: {
  chatId: string;
  meId: string;
  other: Other;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [previewN, setPreviewN] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const initials = (other.alias ?? "??").slice(0, 2).toUpperCase();

  useEffect(() => {
    markChatRead(chatId);
  }, [chatId]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const refetch = async () => {
      const { data } = await supabase
        .from("messages")
        .select(
          "id, chat_id, sender_id, body, created_at, read_by_recipient_at",
        )
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });
      if (cancelled || !data) return;
      const real = data as ChatMessage[];
      const realKey = new Set(real.map((m) => `${m.sender_id}:${m.body}`));
      setMessages((prev) => {
        const stillPending = prev.filter(
          (m) =>
            m.id.startsWith("tmp-") &&
            !realKey.has(`${m.sender_id}:${m.body}`),
        );
        return [...real, ...stillPending];
      });
    };

    const setup = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) supabase.realtime.setAuth(token);
      if (cancelled) return;

      channel = supabase
        .channel(`room-messages-${chatId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `chat_id=eq.${chatId}`,
          },
          (payload) => {
            const incoming = payload.new as ChatMessage;
            setMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id)) return prev;
              const tmpIdx = prev.findIndex(
                (m) =>
                  m.id.startsWith("tmp-") &&
                  m.sender_id === incoming.sender_id &&
                  m.body === incoming.body,
              );
              if (tmpIdx >= 0) {
                const next = [...prev];
                next[tmpIdx] = incoming;
                return next;
              }
              return [...prev, incoming];
            });
            if (incoming.sender_id !== meId) {
              markChatRead(chatId);
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "messages",
            filter: `chat_id=eq.${chatId}`,
          },
          (payload) => {
            const updated = payload.new as ChatMessage;
            setMessages((prev) =>
              prev.map((m) => (m.id === updated.id ? updated : m)),
            );
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") refetch();
        });
    };

    setup();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refetch();
        markChatRead(chatId);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);

    const pollId = window.setInterval(refetch, 8000);

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
      if (channel) supabase.removeChannel(channel);
    };
  }, [chatId, meId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  const submit = () => {
    const trimmed = body.trim();
    if (!trimmed || pending) return;
    setBody("");
    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      chat_id: chatId,
      sender_id: meId,
      body: trimmed,
      created_at: new Date().toISOString(),
      read_by_recipient_at: null,
    };
    setMessages((prev) => [...prev, optimistic]);
    startTransition(async () => {
      const result = await sendMessage(chatId, trimmed);
      if (result.error) {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setBody(trimmed);
        pushAppToast({
          kind: "error",
          title: "No se pudo enviar",
          body: result.error,
        });
      }
    });
  };

  const grouped = useMemo(() => {
    const out: Array<
      | { type: "day"; key: string; label: string }
      | {
          type: "msg";
          key: string;
          msg: ChatMessage;
          mine: boolean;
          showAvatar: boolean;
          isLastFromSender: boolean;
        }
    > = [];
    let lastDay = -1;
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      const day = startOfDay(new Date(m.created_at));
      if (day !== lastDay) {
        out.push({
          type: "day",
          key: `d-${day}`,
          label: formatDayLabel(m.created_at),
        });
        lastDay = day;
      }
      const prev = messages[i - 1];
      const next = messages[i + 1];
      const mine = m.sender_id === meId;
      const showAvatar = !mine && (!prev || prev.sender_id !== m.sender_id);
      const isLastFromSender = !next || next.sender_id !== m.sender_id;
      out.push({
        type: "msg",
        key: m.id,
        msg: m,
        mine,
        showAvatar,
        isLastFromSender,
      });
    }
    return out;
  }, [messages, meId]);

  return (
    <main className="absolute inset-0 mx-auto flex max-w-[430px] flex-col bg-bone">
      <header className="flex items-center gap-3 border-b border-line bg-white px-3 pb-3 pt-14">
        <IconLink href="/chat" ariaLabel="Volver a la lista de chats">
          <ChevronLeft size={18} strokeWidth={2} />
        </IconLink>
        <Link
          href={`/match/${other.id}`}
          aria-label={`Ver perfil de ${other.display_name ?? other.alias}`}
          className="grid h-10 w-10 place-items-center rounded-full font-display text-base text-white"
          style={{ background: other.color ?? "#10C56A" }}
        >
          {initials}
        </Link>
        <Link href={`/match/${other.id}`} className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">
            {other.display_name ?? other.alias}
          </p>
          <p className="truncate text-[11px] text-text-2">
            {other.trades_count != null
              ? `${other.trades_count} intercambios`
              : "Coleccionista"}
          </p>
        </Link>
      </header>

      <div
        ref={scrollRef}
        className="scroll-hide flex-1 overflow-y-auto px-3 py-4"
      >
        {messages.length === 0 && (
          <div className="mt-6 flex flex-col items-center px-4 text-center">
            <div
              className="grid h-14 w-14 place-items-center rounded-full text-white"
              style={{ background: other.color ?? "#10C56A" }}
            >
              <span className="font-display text-base">{initials}</span>
            </div>
            <h3 className="mt-3 font-display text-lg">Saluda a @{other.alias}</h3>
            <p className="mt-1 max-w-xs text-xs leading-snug text-text-2">
              Coordina aquí el lugar y la hora. Para el intercambio en sí pulsa
              el botón verde de la pantalla de match. Puedes referenciar
              cromos por número (ej.{" "}
              <span className="font-semibold text-text">#125</span>) y se
              renderizan como tarjeta interactiva.
            </p>
          </div>
        )}

        {grouped.map((item) => {
          if (item.type === "day") {
            return (
              <div key={item.key} className="my-3 flex justify-center">
                <span className="rounded-full bg-line px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-2">
                  {item.label}
                </span>
              </div>
            );
          }
          return (
            <MessageRow
              key={item.key}
              msg={item.msg}
              mine={item.mine}
              isLastFromSender={item.isLastFromSender}
              otherInitials={initials}
              otherColor={other.color ?? "#10C56A"}
              showAvatar={item.showAvatar}
              onCromoClick={(n) => setPreviewN(n)}
            />
          );
        })}
      </div>

      <div className="flex items-end gap-2 border-t border-line bg-white p-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Escribe un mensaje…"
          rows={1}
          ref={(el) => {
            if (!el) return;
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
          }}
          aria-label="Mensaje"
          className="max-h-[140px] min-h-[44px] flex-1 resize-none rounded-md border border-line bg-paper px-3.5 py-2.5 text-sm leading-snug outline-none focus:border-green-500"
        />
        <IconBtn
          ariaLabel="Enviar mensaje"
          variant="solid"
          onClick={submit}
          disabled={!body.trim() || pending}
        >
          <Send size={18} strokeWidth={2.2} />
        </IconBtn>
      </div>

      {previewN !== null && (
        <CromoPreviewSheet n={previewN} onClose={() => setPreviewN(null)} />
      )}
    </main>
  );
}

function MessageRow({
  msg,
  mine,
  isLastFromSender,
  otherInitials,
  otherColor,
  showAvatar,
  onCromoClick,
}: {
  msg: ChatMessage;
  mine: boolean;
  isLastFromSender: boolean;
  otherInitials: string;
  otherColor: string;
  showAvatar: boolean;
  onCromoClick: (n: number) => void;
}) {
  const isPending = msg.id.startsWith("tmp-");
  const isRead = msg.read_by_recipient_at !== null;
  const time = formatTime(msg.created_at);

  return (
    <div
      className={`mb-0.5 flex items-end gap-1.5 ${
        mine ? "flex-row-reverse" : "flex-row"
      } ${isLastFromSender ? "mb-2" : ""}`}
    >
      {!mine ? (
        showAvatar ? (
          <div
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full font-display text-[11px] text-white"
            style={{ background: otherColor }}
          >
            {otherInitials}
          </div>
        ) : (
          <div className="w-7 shrink-0" />
        )
      ) : null}
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sh1 ${
          mine
            ? `bg-green-500 text-white ${isLastFromSender ? "rounded-br-md" : ""}`
            : `bg-white text-text ${isLastFromSender ? "rounded-bl-md" : ""}`
        }`}
      >
        <p className="whitespace-pre-wrap break-words leading-snug">
          {renderBodyWithCromoChips(msg.body, mine, onCromoClick)}
        </p>
        <div
          className={`mt-1 flex items-center gap-1 text-[10px] leading-none ${
            mine ? "justify-end text-white/70" : "justify-start text-text-2"
          }`}
        >
          <span>{time}</span>
          {mine && (
            <span className="ml-0.5 inline-flex">
              {isPending ? (
                <Clock size={11} strokeWidth={2} />
              ) : isRead ? (
                <CheckCheck size={13} strokeWidth={2.4} className="text-sky-200" />
              ) : (
                <CheckCheck size={13} strokeWidth={2.4} className="text-white/70" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function renderBodyWithCromoChips(
  body: string,
  mine: boolean,
  onCromoClick: (n: number) => void,
): React.ReactNode {
  const re = /#(\d{1,4})\b/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (let m = re.exec(body); m !== null; m = re.exec(body)) {
    const n = Number(m[1]);
    if (n >= 1 && n <= TOTAL_STICKERS) {
      if (m.index > last) out.push(body.slice(last, m.index));
      out.push(
        <button
          key={`c-${i++}-${m.index}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCromoClick(n);
          }}
          className={`mx-0.5 inline-flex items-center rounded px-1.5 py-0.5 align-baseline font-display text-[12px] leading-none transition-colors ${
            mine
              ? "bg-white/20 text-white hover:bg-white/30"
              : "bg-green-100 text-green-700 hover:bg-green-50"
          }`}
        >
          #{n}
        </button>,
      );
      last = m.index + m[0].length;
    }
  }
  if (last < body.length) out.push(body.slice(last));
  return out.length === 0 ? body : out;
}
