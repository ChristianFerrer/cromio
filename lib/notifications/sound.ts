"use client";

const KEY = "cromio:sound-enabled";

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "1";
}

export function setSoundEnabled(on: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, on ? "1" : "0");
}

/**
 * Plays a short two-note "ding" generated via the Web Audio API so we don't
 * need to ship an audio asset. No-op when the user disabled the toggle or
 * when no AudioContext is available (some embedded webviews).
 */
export async function playMessageSound() {
  if (!isSoundEnabled()) return;
  if (typeof window === "undefined") return;
  const AC: typeof AudioContext | undefined =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return;
  try {
    const ctx = new AC();
    // Some browsers start in 'suspended' state until a user gesture.
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        /* ignore */
      }
    }
    const now = ctx.currentTime;
    const tone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.18, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + start + duration,
      );
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.02);
    };
    tone(740, 0, 0.15);
    tone(988, 0.13, 0.18);
    window.setTimeout(() => ctx.close().catch(() => {}), 600);
  } catch {
    /* ignore */
  }
}
