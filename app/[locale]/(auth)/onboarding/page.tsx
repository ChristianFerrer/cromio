"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, ArrowRight, Check } from "lucide-react";
import { COUNTRIES } from "@/lib/data/countries";
import { STICKERS_BY_N, TOTAL_STICKERS } from "@/lib/data/stickers";
import { CromoCard } from "@/components/cromo/CromoCard";
import { Flag } from "@/components/cromo/Flag";
import { Btn } from "@/components/ui/Btn";
import { createClient } from "@/lib/supabase/client";

type Step = "location" | "identity" | "favorite" | "first-cromos";
type Added = { n: number; count: number };

const BARCELONA: [number, number] = [2.1645, 41.3917];

const COLORS = [
  "#1FAE5A", // Cromio green
  "#117C4E", // Cromio dark
  "#2D7DD8", // Match-interest blue
  "#7B5BD8", // Purple
  "#D7263D", // Red
  "#E5006D", // Pink
  "#D4AF37", // Gold
  "#E78C2E", // Orange
  "#3A3A3A", // Charcoal
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("location");
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [favorite, setFavorite] = useState<string | null>(null);
  const [added, setAdded] = useState<Added[]>([]);
  const [num, setNum] = useState("");
  const [alias, setAlias] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [pending, startTransition] = useTransition();

  // Pre-fill alias/name/color from existing profile if present.
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("alias, display_name, color")
        .eq("id", user.id)
        .maybeSingle();
      if (profile) {
        if (profile.alias) setAlias(profile.alias);
        if (profile.display_name) setDisplayName(profile.display_name);
        if (profile.color) setColor(profile.color);
      }
    })();
  }, [router]);

  const finish = () => {
    startTransition(async () => {
      const supabase = createClient();
      if (!supabase) {
        router.replace("/login");
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const point = coords ?? BARCELONA;
      const aliasClean = alias.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 24);
      const updatePayload: Record<string, unknown> = {
        home_location: `POINT(${point[0]} ${point[1]})`,
        color,
      };
      if (aliasClean) updatePayload.alias = aliasClean;
      if (displayName.trim()) updatePayload.display_name = displayName.trim().slice(0, 60);
      await supabase.from("profiles").update(updatePayload).eq("id", user.id);

      if (added.length) {
        await supabase
          .from("user_stickers")
          .upsert(
            added.map((a) => ({
              user_id: user.id,
              sticker_n: a.n,
              count: a.count,
            })),
            { onConflict: "user_id,sticker_n" },
          );
      }
      router.replace("/album");
    });
  };

  if (step === "location") {
    return (
      <main className="flex flex-1 flex-col px-6 pt-16">
        <h1 className="font-display text-4xl">¿Dónde coleccionas?</h1>
        <p className="mt-2 text-sm text-text-2">
          Cromio empareja por proximidad. Necesitamos una ubicación aproximada.
        </p>

        <div className="mt-8 grid place-items-center rounded-2xl bg-paper py-12">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-green-500 text-white shadow-sh2">
            <MapPin size={36} strokeWidth={2} />
          </div>
          <p className="mt-4 px-6 text-center text-sm text-text-2">
            {coords
              ? `Ubicación capturada (${coords[1].toFixed(4)}, ${coords[0].toFixed(4)})`
              : "Compartiremos un punto difuso, no tu calle exacta."}
          </p>
        </div>

        <div className="mt-auto space-y-2 py-6">
          <Btn
            kind="primaryVibrant"
            full
            size="lg"
            onClick={() => {
              if (!navigator.geolocation) {
                setCoords(BARCELONA);
                setStep("identity");
                return;
              }
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  setCoords([pos.coords.longitude, pos.coords.latitude]);
                  setStep("identity");
                },
                () => {
                  setCoords(BARCELONA);
                  setStep("identity");
                },
                { timeout: 6000 },
              );
            }}
          >
            Compartir ubicación
          </Btn>
          <button
            onClick={() => {
              setCoords(BARCELONA);
              setStep("identity");
            }}
            className="block w-full py-2 text-center text-sm text-text-2"
          >
            Saltar — usar Barcelona
          </button>
        </div>
      </main>
    );
  }

  if (step === "identity") {
    const initials = (alias || "?").slice(0, 2).toUpperCase();
    return (
      <main className="flex flex-1 flex-col px-6 pt-16">
        <h1 className="font-display text-4xl">Tu perfil</h1>
        <p className="mt-2 text-sm text-text-2">
          Así te verán los demás coleccionistas en el mapa.
        </p>

        <div className="mt-6 flex flex-col items-center">
          <div
            className="grid h-24 w-24 place-items-center rounded-full font-display text-4xl text-white shadow-sh2"
            style={{ background: color }}
          >
            {initials}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-text-2">
              Alias
            </span>
            <input
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="alias_22"
              maxLength={24}
              className="mt-1 h-11 w-full rounded-md border border-line bg-white px-3.5 text-sm outline-none focus:border-green-500"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-text-2">
              Nombre visible <span className="text-text-2/60">(opcional)</span>
            </span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="María R."
              maxLength={60}
              className="mt-1 h-11 w-full rounded-md border border-line bg-white px-3.5 text-sm outline-none focus:border-green-500"
            />
          </label>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-text-2">
              Color
            </span>
            <div className="mt-1.5 grid grid-cols-9 gap-1.5">
              {COLORS.map((c) => {
                const active = c === color;
                return (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className="grid aspect-square place-items-center rounded-full transition-transform"
                    style={{
                      background: c,
                      transform: active ? "scale(1.1)" : "scale(1)",
                      boxShadow: active
                        ? "0 0 0 3px rgba(11,28,18,0.92)"
                        : "0 1px 2px rgba(0,0,0,.12)",
                    }}
                    aria-label={`Color ${c}`}
                  >
                    {active && <Check size={14} className="text-white" strokeWidth={2.6} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-auto py-6">
          <Btn
            kind="primaryVibrant"
            full
            size="lg"
            disabled={!alias.trim()}
            onClick={() => setStep("favorite")}
          >
            Continuar
          </Btn>
        </div>
      </main>
    );
  }

  if (step === "favorite") {
    return (
      <main className="flex flex-1 flex-col px-6 pt-16">
        <h1 className="font-display text-4xl">Tu equipo favorito</h1>
        <p className="mt-2 text-sm text-text-2">
          Lo destacaremos en tu álbum. Puedes cambiarlo cuando quieras.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-2 overflow-y-auto">
          {COUNTRIES.map((c) => {
            const active = favorite === c.code;
            return (
              <button
                key={c.code}
                onClick={() => setFavorite(c.code)}
                className={`flex flex-col items-center gap-1.5 rounded-md border p-3 ${
                  active ? "border-green-500 bg-green-50" : "border-line bg-white"
                }`}
              >
                <Flag country={c} size={32} />
                <span className="text-[11px] font-semibold">{c.short}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-auto py-6">
          <Btn
            kind="primaryVibrant"
            full
            size="lg"
            disabled={!favorite}
            onClick={() => setStep("first-cromos")}
          >
            Continuar
          </Btn>
          <button
            onClick={() => setStep("first-cromos")}
            className="mt-2 block w-full text-center text-sm text-text-2"
          >
            Saltar
          </button>
        </div>
      </main>
    );
  }

  if (step === "first-cromos") {
    const submitNum = () => {
      if (!num) return;
      const n = Number(num);
      if (n < 1 || n > TOTAL_STICKERS) {
        setNum("");
        return;
      }
      setAdded((prev) => {
        const exists = prev.find((x) => x.n === n);
        if (exists) {
          return prev.map((x) => (x.n === n ? { ...x, count: x.count + 1 } : x));
        }
        return [...prev, { n, count: 1 }];
      });
      setNum("");
    };

    const adjust = (n: number, delta: number) => {
      setAdded((prev) =>
        prev
          .map((x) => (x.n === n ? { ...x, count: x.count + delta } : x))
          .filter((x) => x.count > 0),
      );
    };

    return (
      <main className="flex flex-1 flex-col px-6 pt-16">
        <h1 className="font-display text-3xl">Tus primeros cromos</h1>
        <p className="mt-1 text-sm text-text-2">
          Añade {Math.max(0, 5 - added.length)} más para encontrar matches.
        </p>

        <div className="mt-4 grid max-h-[40vh] grid-cols-3 gap-3 overflow-y-auto pr-1">
          {added.map(({ n, count }) => {
            const sticker = STICKERS_BY_N.get(n);
            if (!sticker) return null;
            return (
              <CromoCard
                key={n}
                sticker={sticker}
                count={count}
                size="sm"
                onAdjust={(d) => adjust(n, d)}
              />
            );
          })}
          {added.length === 0 && (
            <p className="col-span-3 py-12 text-center text-xs text-text-2">
              Tipea abajo el número del cromo para añadirlo.
            </p>
          )}
        </div>

        <div className="mt-4 rounded-md border border-line bg-white px-3.5 py-2 text-center font-display text-2xl">
          {num ? `#${num}` : "#---"}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].map((k) => {
            const isOk = k === "✓";
            const isDel = k === "⌫";
            return (
              <button
                key={k}
                onClick={() => {
                  if (isDel) setNum((v) => v.slice(0, -1));
                  else if (isOk) submitNum();
                  else if (num.length < 4) setNum((v) => v + k);
                }}
                disabled={isOk && !num}
                className={`grid h-12 place-items-center rounded-md font-display text-xl shadow-sh1 disabled:opacity-30 ${
                  isOk ? "bg-green-500 text-white" : "border border-line bg-white text-text"
                }`}
              >
                {k}
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-2 pb-4">
          <Btn
            kind="primaryVibrant"
            full
            size="lg"
            disabled={pending}
            onClick={finish}
            icon={<ArrowRight size={16} />}
          >
            {pending
              ? "Guardando…"
              : added.length >= 5
                ? "Empezar a buscar matches"
                : added.length === 0
                  ? "Saltar y añadir más tarde"
                  : `Continuar con ${added.length} cromo${added.length > 1 ? "s" : ""}`}
          </Btn>
        </div>
      </main>
    );
  }

  return null;
}
