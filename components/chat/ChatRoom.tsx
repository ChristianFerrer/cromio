"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCheck,
  CheckCircle2,
  ChevronLeft,
  Clock,
  MapPin,
  Send,
  X,
} from "lucide-react";
import type { ChatMessage, ChatMeeting, ChatState } from "@/lib/chat/queries";
import {
  sendMessage,
  markChatRead,
  proposeMeeting,
  respondToMeeting,
  completeMeeting,
  rateChat,
} from "@/lib/chat/actions";
import { createClient } from "@/lib/supabase/client";
import { pushAppToast } from "@/lib/notifications/toast";

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
  if (diffDays < 7)
    return d.toLocaleDateString("es-ES", { weekday: "long" });
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
  initialState,
  initialMeeting,
  initialMyRated,
}: {
  chatId: string;
  meId: string;
  other: Other;
  initialMessages: ChatMessage[];
  initialState: ChatState;
  initialMeeting: ChatMeeting;
  initialMyRated: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [chatState, setChatState] = useState<ChatState>(initialState);
  const [meeting, setMeeting] = useState<ChatMeeting>(initialMeeting);
  const [myRated, setMyRated] = useState(initialMyRated);
  const [showProposeSheet, setShowProposeSheet] = useState(false);
  const [showRateSheet, setShowRateSheet] = useState(false);
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
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "chats",
            filter: `id=eq.${chatId}`,
          },
          (payload) => {
            const c = payload.new as {
              state: ChatState;
              meeting_place: string | null;
              meeting_at: string | null;
              meeting_proposer_id: string | null;
            };
            setChatState(c.state);
            setMeeting(
              c.meeting_at
                ? {
                    place: c.meeting_place ?? "",
                    at: c.meeting_at,
                    proposer_id: c.meeting_proposer_id ?? "",
                  }
                : null,
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
          body: "Revisa tu conexión y vuelve a intentarlo.",
        });
      }
    });
  };

  // Group messages with day separators and consecutive-sender flags
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
        <Link
          href="/chat"
          className="grid h-9 w-9 place-items-center rounded-md border border-line bg-white"
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </Link>
        <Link
          href={`/match/${other.id}`}
          className="grid h-10 w-10 place-items-center rounded-full font-display text-base text-white"
          style={{ background: other.color ?? "#1FAE5A" }}
        >
          {initials}
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">
            {other.display_name ?? other.alias}
          </p>
          <p className="truncate text-[11px] text-text-2">
            {other.rating ? `★ ${other.rating}` : "Coleccionista"}
            {other.trades_count != null && ` · ${other.trades_count} cambios`}
          </p>
        </div>
      </header>

      <MeetingBanner
        chatId={chatId}
        meId={meId}
        meeting={meeting}
        chatState={chatState}
        myRated={myRated}
        onPropose={() => setShowProposeSheet(true)}
        onMarkComplete={() => {
          startTransition(async () => {
            const r = await completeMeeting(chatId);
            if (r?.error) pushAppToast({ kind: "error", body: "No se pudo cerrar la quedada" });
          });
        }}
        onRate={() => setShowRateSheet(true)}
      />

      <div
        ref={scrollRef}
        className="scroll-hide flex-1 overflow-y-auto px-3 py-4"
      >
        {messages.length === 0 && (
          <p className="py-12 text-center text-xs text-text-2">
            Empieza la conversación. Sé claro con qué cromos quieres intercambiar.
          </p>
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
              otherColor={other.color ?? "#1FAE5A"}
              showAvatar={item.showAvatar}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-2 border-t border-line bg-white p-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        <button
          onClick={() => setShowProposeSheet(true)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-line bg-white text-text-2"
          aria-label="Proponer quedada"
          disabled={chatState === "completed" || chatState === "cancelled"}
        >
          <Calendar size={18} strokeWidth={2} />
        </button>
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Escribe un mensaje…"
          className="h-11 flex-1 rounded-md border border-line bg-paper px-3.5 text-sm outline-none focus:border-green-500"
        />
        <button
          onClick={submit}
          disabled={!body.trim() || pending}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-green-500 text-white disabled:opacity-40"
          aria-label="Enviar"
        >
          <Send size={18} strokeWidth={2.2} />
        </button>
      </div>

      {showProposeSheet && (
        <ProposeMeetingSheet
          initial={meeting}
          onClose={() => setShowProposeSheet(false)}
          onSubmit={(place, whenIso) => {
            startTransition(async () => {
              const r = await proposeMeeting(chatId, place, whenIso);
              if (r?.error) {
                pushAppToast({ kind: "error", body: "No se pudo enviar la propuesta" });
                return;
              }
              pushAppToast({ kind: "success", body: "Propuesta enviada" });
              setShowProposeSheet(false);
            });
          }}
        />
      )}

      {showRateSheet && (
        <RateChatSheet
          onClose={() => setShowRateSheet(false)}
          onSubmit={(stars, note) => {
            startTransition(async () => {
              const r = await rateChat(chatId, stars, note);
              if (r?.error) {
                pushAppToast({
                  kind: "error",
                  body:
                    r.error === "already_rated"
                      ? "Ya valoraste este intercambio"
                      : "No se pudo guardar la valoración",
                });
                return;
              }
              pushAppToast({ kind: "success", body: "¡Gracias por tu valoración!" });
              setMyRated(true);
              setShowRateSheet(false);
            });
          }}
        />
      )}
    </main>
  );
}

function MeetingBanner({
  chatId,
  meId,
  meeting,
  chatState,
  myRated,
  onPropose,
  onMarkComplete,
  onRate,
}: {
  chatId: string;
  meId: string;
  meeting: ChatMeeting;
  chatState: ChatState;
  myRated: boolean;
  onPropose: () => void;
  onMarkComplete: () => void;
  onRate: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const respond = useCallback(
    (accept: boolean) => {
      startTransition(async () => {
        const r = await respondToMeeting(chatId, accept);
        if (r?.error) pushAppToast({ kind: "error", body: "No se pudo responder" });
      });
    },
    [chatId],
  );

  if (chatState === "completed") {
    return (
      <div className="flex items-center gap-2 border-b border-green-100 bg-green-50 px-3 py-2 text-xs text-green-700">
        <CheckCircle2 size={14} strokeWidth={2.2} />
        <span className="flex-1">Intercambio completado</span>
        {!myRated && (
          <button
            onClick={onRate}
            className="rounded-md bg-green-500 px-2.5 py-1 font-bold text-white"
          >
            Valorar
          </button>
        )}
      </div>
    );
  }

  if (chatState === "cancelled") {
    return (
      <div className="flex items-center gap-2 border-b border-line bg-paper px-3 py-2 text-xs text-text-2">
        <X size={14} strokeWidth={2.2} />
        <span className="flex-1">Quedada cancelada</span>
        <button onClick={onPropose} className="rounded-md border border-line bg-white px-2.5 py-1 font-bold">
          Proponer otra
        </button>
      </div>
    );
  }

  if (!meeting) return null;

  const when = new Date(meeting.at);
  const dateLabel = when.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeLabel = when.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const iProposed = meeting.proposer_id === meId;

  return (
    <div
      className={`flex items-center gap-2.5 border-b px-3 py-2.5 text-xs ${
        chatState === "confirmed"
          ? "border-green-100 bg-green-50 text-green-700"
          : "border-gold/30 bg-gold/10 text-gold-dark"
      }`}
    >
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
          chatState === "confirmed" ? "bg-green-500" : "bg-gold"
        } text-white`}
      >
        {chatState === "confirmed" ? (
          <CheckCircle2 size={14} strokeWidth={2.4} />
        ) : (
          <Calendar size={14} strokeWidth={2.4} />
        )}
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate font-bold">
          {chatState === "confirmed" ? "Quedada confirmada" : "Propuesta de quedada"}
        </p>
        <p className="truncate text-[11px] opacity-80">
          {dateLabel} · {timeLabel} · {meeting.place}
        </p>
      </div>
      {chatState === "pending" && !iProposed && (
        <div className="flex shrink-0 gap-1">
          <button
            disabled={pending}
            onClick={() => respond(false)}
            className="rounded-md border border-line bg-white px-2 py-1 text-text-2 disabled:opacity-50"
          >
            Rechazar
          </button>
          <button
            disabled={pending}
            onClick={() => respond(true)}
            className="rounded-md bg-green-500 px-2 py-1 font-bold text-white disabled:opacity-50"
          >
            Aceptar
          </button>
        </div>
      )}
      {chatState === "pending" && iProposed && (
        <span className="shrink-0 text-[11px] opacity-60">Esperando respuesta…</span>
      )}
      {chatState === "confirmed" && (
        <button
          onClick={onMarkComplete}
          className="shrink-0 rounded-md bg-green-500 px-2.5 py-1 font-bold text-white"
        >
          Hecho
        </button>
      )}
    </div>
  );
}

function ProposeMeetingSheet({
  initial,
  onClose,
  onSubmit,
}: {
  initial: ChatMeeting;
  onClose: () => void;
  onSubmit: (place: string, whenIso: string) => void;
}) {
  const defaultWhen = useMemo(() => {
    const d = initial?.at ? new Date(initial.at) : new Date(Date.now() + 24 * 3600 * 1000);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours(),
    )}:${pad(d.getMinutes())}`;
  }, [initial]);
  const [place, setPlace] = useState(initial?.place ?? "");
  const [when, setWhen] = useState(defaultWhen);

  return (
    <SheetWrapper title="Proponer quedada" onClose={onClose}>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-text-2">
          Lugar
        </span>
        <div className="mt-1 flex items-center gap-2 rounded-md border border-line bg-white px-3.5">
          <MapPin size={14} className="text-text-2" />
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="Plaza Cataluña, Barcelona"
            maxLength={200}
            className="h-11 flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </label>
      <label className="mt-3 block">
        <span className="text-xs font-bold uppercase tracking-wider text-text-2">
          Fecha y hora
        </span>
        <input
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          className="mt-1 h-11 w-full rounded-md border border-line bg-white px-3.5 text-sm outline-none"
        />
      </label>
      <button
        onClick={() => {
          if (!place.trim() || !when) return;
          const dt = new Date(when);
          if (Number.isNaN(dt.getTime())) return;
          onSubmit(place.trim(), dt.toISOString());
        }}
        disabled={!place.trim() || !when}
        className="mt-5 h-12 w-full rounded-md bg-green-500 font-bold text-white disabled:opacity-50"
      >
        Enviar propuesta
      </button>
    </SheetWrapper>
  );
}

function RateChatSheet({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (stars: number, note: string) => void;
}) {
  const [stars, setStars] = useState(5);
  const [note, setNote] = useState("");
  return (
    <SheetWrapper title="¿Cómo fue el intercambio?" onClose={onClose}>
      <div className="flex justify-center gap-1.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onClick={() => setStars(s)}
            className="text-3xl"
            style={{ color: s <= stars ? "#D4AF37" : "#D8D5C9" }}
            aria-label={`${s} estrellas`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        maxLength={280}
        placeholder="Comentario (opcional)"
        className="mt-4 w-full resize-none rounded-md border border-line bg-white px-3.5 py-2 text-sm outline-none focus:border-green-500"
      />
      <button
        onClick={() => onSubmit(stars, note)}
        className="mt-4 h-12 w-full rounded-md bg-green-500 font-bold text-white"
      >
        Enviar valoración
      </button>
    </SheetWrapper>
  );
}

function SheetWrapper({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center">
      <button
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        aria-label="Cerrar"
      />
      <div className="relative mx-auto w-full max-w-[430px] rounded-t-2xl bg-white p-5 pb-[max(env(safe-area-inset-bottom),20px)] shadow-sh3 animate-slide-down">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl">{title}</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md border border-line"
            aria-label="Cerrar"
          >
            <X size={14} strokeWidth={2.2} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function MessageRow({
  msg,
  mine,
  isLastFromSender,
  otherInitials,
  otherColor,
  showAvatar,
}: {
  msg: ChatMessage;
  mine: boolean;
  isLastFromSender: boolean;
  otherInitials: string;
  otherColor: string;
  showAvatar: boolean;
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
        <p className="whitespace-pre-wrap break-words leading-snug">{msg.body}</p>
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
