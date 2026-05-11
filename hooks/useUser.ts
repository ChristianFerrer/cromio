"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type Snapshot = { user: User | null; isAdmin: boolean; loading: boolean };

// Module-level cache so a navigation from /album to /mapa doesn't refire
// supabase.auth.getUser() (a real round-trip to the auth server).
// First mount in the SPA session pays the network cost; every subsequent
// useUser() call reads from `cached` instantly.
let cached: Snapshot | null = null;
let pending: Promise<Snapshot> | null = null;
let authSubInstalled = false;
const subscribers = new Set<(s: Snapshot) => void>();

function publish(next: Snapshot) {
  cached = next;
  for (const fn of subscribers) fn(next);
}

async function load(): Promise<Snapshot> {
  if (cached) return cached;
  if (pending) return pending;
  pending = (async () => {
    const supabase = createClient();
    if (!supabase) {
      const s: Snapshot = { user: null, isAdmin: false, loading: false };
      cached = s;
      return s;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const s: Snapshot = { user: null, isAdmin: false, loading: false };
      cached = s;
      return s;
    }
    // Surface the user immediately; admin flag arrives in a tick. Most
    // pages don't read isAdmin so they paint without waiting for it.
    cached = { user, isAdmin: false, loading: false };
    void supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        publish({ user, isAdmin: Boolean(data?.is_admin), loading: false });
      });
    return cached;
  })();
  const result = await pending;
  pending = null;
  return result;
}

function installAuthListenerOnce() {
  if (authSubInstalled) return;
  authSubInstalled = true;
  const supabase = createClient();
  if (!supabase) return;
  supabase.auth.onAuthStateChange((_evt, session) => {
    const next = session?.user ?? null;
    if (!next) {
      publish({ user: null, isAdmin: false, loading: false });
      return;
    }
    publish({ user: next, isAdmin: cached?.isAdmin ?? false, loading: false });
    void supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", next.id)
      .maybeSingle()
      .then(({ data }) => {
        publish({ user: next, isAdmin: Boolean(data?.is_admin), loading: false });
      });
  });
}

export function useUser() {
  const [snapshot, setSnapshot] = useState<Snapshot>(
    () => cached ?? { user: null, isAdmin: false, loading: true },
  );

  useEffect(() => {
    let cancelled = false;
    const sub = (s: Snapshot) => {
      if (!cancelled) setSnapshot(s);
    };
    subscribers.add(sub);
    installAuthListenerOnce();
    load().then((s) => {
      if (!cancelled) setSnapshot(s);
    });
    return () => {
      cancelled = true;
      subscribers.delete(sub);
    };
  }, []);

  return snapshot;
}
