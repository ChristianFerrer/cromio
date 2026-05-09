"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, Send } from "lucide-react";
import type { ChatMessage } from "@/lib/chat/queries";
import { sendMessage, markChatRead } from "@/lib/chat/actions";
import { createClient } from "@/lib/supabase/client";

type Other = {
  id: string;
  alias: string;
  display_name: string | null;
  avatar_url: string | null;
  color: string | null;
  rating: number | null;
  trades_count: number | null;
};

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
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const initials = (other.alias ?? "??").slice(0, 2).toUpperCase();

  useEffect(() => {
    markChatRead(chatId);
  }, [chatId]);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${chatId}` },
        (payload) => {
          setMessages((prev) => {
            const incoming = payload.new as ChatMessage;
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
          if (payload.new && (payload.new as ChatMessage).sender_id !== meId) {
            markChatRead(chatId);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, meId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const submit = () => {
    const trimmed = body.trim();
    if (!trimmed || pending) return;
    setBody("");
    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
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
      }
    });
  };

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

      <div ref={scrollRef} className="scroll-hide flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
        {messages.length === 0 && (
          <p className="py-12 text-center text-xs text-text-2">
            Empieza la conversación. Sé claro con qué cromos quieres intercambiar.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === meId;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${
                  mine
                    ? "rounded-br-md bg-green-500 text-white"
                    : "rounded-bl-md bg-white text-text shadow-sh1"
                }`}
              >
                {m.body}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 border-t border-line bg-white p-3 pb-[max(env(safe-area-inset-bottom),12px)]">
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
    </main>
  );
}
