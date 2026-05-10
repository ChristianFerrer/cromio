"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  MessageCircle,
  Sparkles,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { subscribeAppToast } from "@/lib/notifications/toast";
import { EnablePush } from "./EnablePush";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { InstallPwaBanner } from "./InstallPwaBanner";

type Toast =
  | {
      id: string;
      kind: "message";
      chatId: string;
      senderName: string;
      body: string;
      color?: string;
    }
  | {
      id: string;
      kind: "match" | "lead";
      userId: string;
      alias: string;
      youGet: number;
      theyGet: number;
    }
  | {
      id: string;
      kind: "app";
      level: "success" | "error" | "info";
      title?: string;
      body: string;
      url?: string;
    };

type NotifContext = {
  unreadByChat: Record<string, number>;
  totalUnread: number;
  newNearbyCount: number;
  resetNearbyCount: () => void;
  clearChatUnread: (chatId: string) => void;
};

const Ctx = createContext<NotifContext | null>(null);

export function useNotifications() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useNotifications outside provider");
  return v;
}

const TOAST_TTL = 4500;

export function NotificationsRoot({
  children,
  initialUnread,
}: {
  children: React.ReactNode;
  initialUnread: Record<string, number>;
}) {
  const { user } = useUser();
  const pathname = usePathname();
  const [unreadByChat, setUnreadByChat] = useState(initialUnread);
  const [newNearbyCount, setNewNearbyCount] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const knownNearbyRef = useRef<Set<string>>(new Set());
  const seenSelfMessages = useRef<Set<string>>(new Set());

  const activeChatId = useMemo(() => {
    const m = pathname.match(/\/chat\/([^/?]+)/);
    return m?.[1] ?? null;
  }, [pathname]);

  const onMapa = /\/mapa(\/|$)/.test(pathname);

  const pushToast = useCallback((t: Toast, ttl = TOAST_TTL) => {
    setToasts((prev) => [...prev.slice(-3), t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
    }, ttl);
  }, []);

  // Listen for in-app toast events (errors, success, info from anywhere)
  useEffect(() => {
    return subscribeAppToast((t) => {
      pushToast(
        {
          id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          kind: "app",
          level: t.kind,
          title: t.title,
          body: t.body,
          url: t.url,
        },
        t.ttlMs ?? TOAST_TTL,
      );
    });
  }, [pushToast]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const clearChatUnread = useCallback((chatId: string) => {
    setUnreadByChat((prev) => {
      if (!prev[chatId]) return prev;
      const next = { ...prev };
      delete next[chatId];
      return next;
    });
  }, []);

  const resetNearbyCount = useCallback(() => setNewNearbyCount(0), []);

  // Auto-clear unread badge when entering a chat
  useEffect(() => {
    if (activeChatId) clearChatUnread(activeChatId);
  }, [activeChatId, clearChatUnread]);

  // Auto-reset nearby badge when on mapa
  useEffect(() => {
    if (onMapa) resetNearbyCount();
  }, [onMapa, resetNearbyCount]);

  // Realtime: messages
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    if (!supabase) return;
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setup = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) supabase.realtime.setAuth(token);
      if (cancelled) return;

      channel = supabase
        .channel(`global-messages-${user.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          async (payload) => {
            const m = payload.new as {
              id: string;
              chat_id: string;
              sender_id: string;
              body: string;
            };
            if (m.sender_id === user.id) {
              seenSelfMessages.current.add(m.id);
              return;
            }
            // Don't notify if user is currently viewing that chat
            if (m.chat_id === activeChatIdRef.current) return;

            setUnreadByChat((prev) => ({
              ...prev,
              [m.chat_id]: (prev[m.chat_id] ?? 0) + 1,
            }));

            // Look up sender alias for the toast (best-effort)
            const { data: prof } = await supabase
              .from("profiles")
              .select("alias, color")
              .eq("id", m.sender_id)
              .maybeSingle();

            pushToast({
              id: m.id,
              kind: "message",
              chatId: m.chat_id,
              senderName: prof?.alias ?? "Coleccionista",
              body: m.body,
              color: prof?.color ?? "#1FAE5A",
            });
          },
        )
        .subscribe();
    };
    setup();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [user, pushToast]);

  // Keep activeChatId in a ref so the channel callback can always read fresh
  const activeChatIdRef = useRef(activeChatId);
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  // Realtime: nearby new matches/leads. Polls find_nearby_users when
  // user_stickers or profiles change, and toasts new entries.
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    if (!supabase) return;

    let cancelled = false;
    let debounce: ReturnType<typeof setTimeout> | null = null;

    const checkNearby = async () => {
      const { data } = await supabase.rpc("find_nearby_users", {
        p_user_id: user.id,
        p_radius_m: 5000,
      });
      if (cancelled || !Array.isArray(data)) return;

      type Row = {
        user_id: string;
        alias: string;
        kind: "match" | "lead";
        you_get: number[] | null;
        they_get: number[] | null;
      };
      const rows = data as Row[];
      const isFirst = knownNearbyRef.current.size === 0;
      const fresh: Row[] = [];
      for (const r of rows) {
        if (!knownNearbyRef.current.has(r.user_id)) {
          knownNearbyRef.current.add(r.user_id);
          if (!isFirst) fresh.push(r);
        }
      }
      if (fresh.length > 0 && !cancelled) {
        if (!onMapaRef.current) {
          setNewNearbyCount((c) => c + fresh.length);
        }
        for (const r of fresh.slice(0, 2)) {
          pushToast({
            id: `near-${r.user_id}-${Date.now()}`,
            kind: r.kind,
            userId: r.user_id,
            alias: r.alias,
            youGet: r.you_get?.length ?? 0,
            theyGet: r.they_get?.length ?? 0,
          });
        }
      }
    };

    const debounced = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(checkNearby, 800);
    };

    void checkNearby();
    const channel = supabase
      .channel(`nearby-watch-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_stickers" },
        debounced,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        debounced,
      )
      .subscribe();

    return () => {
      cancelled = true;
      if (debounce) clearTimeout(debounce);
      supabase.removeChannel(channel);
    };
  }, [user, pushToast]);

  const onMapaRef = useRef(onMapa);
  useEffect(() => {
    onMapaRef.current = onMapa;
  }, [onMapa]);

  const totalUnread = useMemo(
    () => Object.values(unreadByChat).reduce((a, b) => a + b, 0),
    [unreadByChat],
  );

  return (
    <Ctx.Provider
      value={{
        unreadByChat,
        totalUnread,
        newNearbyCount,
        resetNearbyCount,
        clearChatUnread,
      }}
    >
      {children}
      <ToastStack toasts={toasts} dismiss={dismissToast} />
      <ServiceWorkerRegistrar />
      <EnablePush />
      <InstallPwaBanner />
    </Ctx.Provider>
  );
}

function ToastStack({
  toasts,
  dismiss,
}: {
  toasts: Toast[];
  dismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] mx-auto flex max-w-[430px] flex-col gap-2 px-3 pt-[max(env(safe-area-inset-top),12px)]">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  if (toast.kind === "message") {
    const initials = toast.senderName.slice(0, 2).toUpperCase();
    return (
      <Link
        href={`/chat/${toast.chatId}`}
        onClick={onDismiss}
        className="pointer-events-auto flex animate-slide-down items-center gap-2.5 rounded-md border border-black/5 bg-white/95 p-2.5 shadow-sh3 backdrop-blur-xl"
      >
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-sm text-white"
          style={{ background: toast.color ?? "#1FAE5A" }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-text">
            {toast.senderName}
          </p>
          <p className="truncate text-xs text-text-2">{toast.body}</p>
        </div>
        <MessageCircle size={16} strokeWidth={2.2} className="text-green-700" />
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDismiss();
          }}
          className="grid h-6 w-6 shrink-0 place-items-center rounded text-text-2"
          aria-label="Cerrar"
        >
          <X size={14} strokeWidth={2.2} />
        </button>
      </Link>
    );
  }
  if (toast.kind === "app") {
    const Icon =
      toast.level === "success"
        ? CheckCircle2
        : toast.level === "error"
          ? AlertTriangle
          : Info;
    const accent =
      toast.level === "success"
        ? "var(--y-green-700)"
        : toast.level === "error"
          ? "#D7263D"
          : "#2D7DD8";
    const className =
      "pointer-events-auto flex animate-slide-down items-center gap-2.5 rounded-md border border-black/5 bg-white/95 p-2.5 shadow-sh3 backdrop-blur-xl";
    const inner = (
      <>
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white"
          style={{ background: accent }}
        >
          <Icon size={16} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          {toast.title && (
            <p className="truncate text-sm font-bold text-text">{toast.title}</p>
          )}
          <p className="truncate text-xs text-text-2">{toast.body}</p>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDismiss();
          }}
          className="grid h-6 w-6 shrink-0 place-items-center rounded text-text-2"
          aria-label="Cerrar"
        >
          <X size={14} strokeWidth={2.2} />
        </button>
      </>
    );
    return toast.url ? (
      <Link href={toast.url} onClick={onDismiss} className={className}>
        {inner}
      </Link>
    ) : (
      <div className={className}>{inner}</div>
    );
  }

  const isMatch = toast.kind === "match";
  const accent = isMatch ? "var(--y-green-700)" : "#2D7DD8";
  return (
    <Link
      href={`/match/${toast.userId}`}
      onClick={onDismiss}
      className="pointer-events-auto flex animate-slide-down items-center gap-2.5 rounded-md border border-black/5 bg-white/95 p-2.5 shadow-sh3 backdrop-blur-xl"
    >
      <div
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white"
        style={{ background: accent }}
      >
        <Sparkles size={16} strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-text">
          {isMatch ? "Nuevo match" : "Cromos que te interesan"}: {toast.alias}
        </p>
        <p className="truncate text-xs text-text-2">
          {isMatch
            ? `Recibes ${toast.youGet} · Entregas ${toast.theyGet}`
            : `Tiene ${toast.youGet} cromos que te faltan`}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDismiss();
        }}
        className="grid h-6 w-6 shrink-0 place-items-center rounded text-text-2"
        aria-label="Cerrar"
      >
        <X size={14} strokeWidth={2.2} />
      </button>
    </Link>
  );
}
