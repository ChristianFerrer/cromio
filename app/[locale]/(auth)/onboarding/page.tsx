"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus, ArrowRight } from "lucide-react";
import { COUNTRIES } from "@/lib/data/countries";
import { STICKERS_BY_N, TOTAL_STICKERS } from "@/lib/data/stickers";
import { CromoCard } from "@/components/cromo/CromoCard";
import { Flag } from "@/components/cromo/Flag";
import { Btn } from "@/components/ui/Btn";
import { createClient } from "@/lib/supabase/client";

type Step = "location" | "favorite" | "first-cromos" | "done";
type Added = { n: number; count: number };

const BARCELONA: [number, number] = [2.1645, 41.3917];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("location");
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [favorite, setFavorite] = useState<string | null>(null);
  const [added, setAdded] = useState<Added[]>([]);
  const [num, setNum] = useState("");
  const [pending, startTransition] = useTransition();

  const finish = () => {
    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const point = coords ?? BARCELONA;
      await supabase
        .from("profiles")
        .update({
          home_location: `POINT(${point[0]} ${point[1]})`,
        })
        .eq("id", user.id);

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
                setStep("favorite");
                return;
              }
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  setCoords([pos.coords.longitude, pos.coords.latitude]);
                  setStep("favorite");
                },
                () => {
                  setCoords(BARCELONA);
                  setStep("favorite");
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
              setStep("favorite");
            }}
            className="block w-full py-2 text-center text-sm text-text-2"
          >
            Saltar — usar Barcelona
          </button>
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
            {added.length >= 5
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
