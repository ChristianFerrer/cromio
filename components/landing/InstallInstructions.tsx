"use client";

import { useEffect, useState } from "react";
import { Apple, Smartphone, Monitor, Check } from "lucide-react";

type Platform = "ios" | "android" | "desktop";

type Copy = {
  title: string;
  sub: string;
  tabs: { ios: string; android: string; desktop: string };
  ios: string[];
  iosNote: string;
  android: string[];
  androidNote: string;
  desktop: string[];
  desktopNote: string;
};

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "desktop";
  const ua = window.navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export function InstallInstructions({ copy }: { copy: Copy }) {
  // Default to "ios" so SSR markup matches what most mobile visitors
  // will see. Effect below corrects this on mount.
  const [platform, setPlatform] = useState<Platform>("ios");

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  const TABS: Array<{ id: Platform; icon: typeof Apple; label: string }> = [
    { id: "ios", icon: Apple, label: copy.tabs.ios },
    { id: "android", icon: Smartphone, label: copy.tabs.android },
    { id: "desktop", icon: Monitor, label: copy.tabs.desktop },
  ];

  const steps =
    platform === "ios" ? copy.ios : platform === "android" ? copy.android : copy.desktop;
  const note =
    platform === "ios"
      ? copy.iosNote
      : platform === "android"
        ? copy.androidNote
        : copy.desktopNote;

  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-sh2 sm:p-8">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = t.id === platform;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setPlatform(t.id)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                active
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-paper text-text-2 hover:bg-bone"
              }`}
            >
              <Icon size={13} strokeWidth={2.2} />
              {t.label}
            </button>
          );
        })}
      </div>

      <ol className="mt-6 space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-green-500 text-[11px] font-bold text-white">
              {i + 1}
            </span>
            <p className="pt-0.5 text-sm leading-snug text-text">{s}</p>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex items-start gap-2 rounded-md border border-line bg-paper p-3 text-xs text-text-2">
        <Check size={14} strokeWidth={2.4} className="mt-0.5 shrink-0 text-green-700" />
        <p className="leading-snug">{note}</p>
      </div>
    </div>
  );
}
