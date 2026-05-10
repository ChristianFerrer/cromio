export type AppToast = {
  kind: "success" | "error" | "info";
  title?: string;
  body: string;
  url?: string;
  ttlMs?: number;
};

const EVENT = "cromio:toast";

export function pushAppToast(t: AppToast) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<AppToast>(EVENT, { detail: t }));
}

export function subscribeAppToast(handler: (t: AppToast) => void) {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => handler((e as CustomEvent<AppToast>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
