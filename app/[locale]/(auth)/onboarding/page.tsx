"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Globe,
  MapPin,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { COUNTRIES } from "@/lib/data/countries";
import { STICKERS } from "@/lib/data/stickers";
import { CromoCard } from "@/components/cromo/CromoCard";
import { Flag } from "@/components/cromo/Flag";
import { Btn } from "@/components/ui/Btn";
import { Chip } from "@/components/ui/Chip";
import { IconBtn } from "@/components/ui/IconBtn";
import { createClient } from "@/lib/supabase/client";

const STEPS = ["location", "identity", "favorite", "first-cromos"] as const;
type Step = (typeof STEPS)[number];
type Added = { n: number; count: number };

const STEP_TITLES: Record<Step, string> = {
  location: "Ubicación",
  identity: "Tu perfil",
  favorite: "Equipo favorito",
  "first-cromos": "Primeros cromos",
};

const COLORS = [
  "#1FAE5A",
  "#117C4E",
  "#2D7DD8",
  "#7B5BD8",
  "#D7263D",
  "#E5006D",
  "#D4AF37",
  "#E78C2E",
  "#3A3A3A",
];

const ALIAS_RE = /^[a-z0-9_]{3,24}$/;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("location");
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [favorite, setFavorite] = useState<string | null>(null);
  const [added, setAdded] = useState<Added[]>([]);
  const [alias, setAlias] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [pending, startTransition] = useTransition();

  const stepIndex = STEPS.indexOf(step);
  const goBack = () => {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1]);
  };

  // Pre-fill from existing profile if present (OAuth users may already have one).
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

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Tu navegador no soporta geolocalización.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords([pos.coords.longitude, pos.coords.latitude]);
        setLocating(false);
        setStep("identity");
      },
      (err) => {
        setLocating(false);
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "Has bloqueado la ubicación. Actívala en Ajustes para que el mapa muestre coleccionistas cerca."
            : err.code === err.TIMEOUT
              ? "No conseguimos detectar tu ubicación a tiempo. Reintenta o usa una ciudad de referencia."
              : "No pudimos detectar tu ubicación.";
        setLocationError(msg);
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  };

  const finish = () => {
    if (!coords) return;
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
      const aliasClean = alias.trim().toLowerCase();
      const updatePayload: Record<string, unknown> = {
        home_location: `POINT(${coords[0]} ${coords[1]})`,
        color,
      };
      if (ALIAS_RE.test(aliasClean)) updatePayload.alias = aliasClean;
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

  return (
    <main className="flex min-h-dvh flex-1 flex-col">
      <Stepper current={stepIndex} total={STEPS.length} title={STEP_TITLES[step]} onBack={stepIndex > 0 ? goBack : undefined} />

      {step === "location" && (
        <LocationStep
          coords={coords}
          locating={locating}
          error={locationError}
          onRequest={requestLocation}
          onPickFallback={(c) => {
            setCoords(c);
            setStep("identity");
          }}
        />
      )}

      {step === "identity" && (
        <IdentityStep
          alias={alias}
          setAlias={setAlias}
          displayName={displayName}
          setDisplayName={setDisplayName}
          color={color}
          setColor={setColor}
          onContinue={() => setStep("favorite")}
        />
      )}

      {step === "favorite" && (
        <FavoriteStep
          favorite={favorite}
          setFavorite={setFavorite}
          onContinue={() => setStep("first-cromos")}
        />
      )}

      {step === "first-cromos" && (
        <FirstCromosStep
          added={added}
          setAdded={setAdded}
          pending={pending}
          onFinish={finish}
        />
      )}
    </main>
  );
}

function Stepper({
  current,
  total,
  title,
  onBack,
}: {
  current: number;
  total: number;
  title: string;
  onBack?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-5 pt-12 pb-4">
      {onBack ? (
        <IconBtn ariaLabel="Atrás" size="sm" onClick={onBack}>
          <ChevronLeft size={16} strokeWidth={2.2} />
        </IconBtn>
      ) : (
        <div className="h-10 w-10" />
      )}
      <div className="flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-text-2">
          Paso {current + 1} de {total}
        </p>
        <p className="font-display text-lg leading-tight">{title}</p>
      </div>
      <div className="flex w-24 items-center gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= current ? "bg-green-500" : "bg-line"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function LocationStep({
  coords,
  locating,
  error,
  onRequest,
  onPickFallback,
}: {
  coords: [number, number] | null;
  locating: boolean;
  error: string | null;
  onRequest: () => void;
  onPickFallback: (c: [number, number]) => void;
}) {
  // Hand-curated city fallbacks so users without geolocation can still
  // get a meaningful starting point.
  const CITIES: Array<{ label: string; coords: [number, number] }> = [
    { label: "Barcelona", coords: [2.1645, 41.3917] },
    { label: "Madrid", coords: [-3.7038, 40.4168] },
    { label: "Valencia", coords: [-0.3763, 39.4699] },
    { label: "Sevilla", coords: [-5.9845, 37.3891] },
    { label: "Bilbao", coords: [-2.9253, 43.2627] },
    { label: "México DF", coords: [-99.1332, 19.4326] },
    { label: "Buenos Aires", coords: [-58.3816, -34.6037] },
    { label: "Bogotá", coords: [-74.0721, 4.711] },
  ];

  return (
    <div className="flex flex-1 flex-col px-6">
      <h1 className="font-display text-4xl">¿Dónde coleccionas?</h1>
      <p className="mt-2 text-sm text-text-2">
        Cromio empareja por proximidad. Necesitamos una ubicación aproximada — no compartiremos tu calle exacta.
      </p>

      <div className="mt-6 grid place-items-center rounded-2xl bg-paper py-10">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-green-500 text-white shadow-sh2">
          {locating ? (
            <Loader2 size={36} strokeWidth={2} className="animate-spin" />
          ) : (
            <MapPin size={36} strokeWidth={2} />
          )}
        </div>
        <p className="mt-4 px-6 text-center text-sm text-text-2">
          {coords
            ? `Capturada (${coords[1].toFixed(3)}, ${coords[0].toFixed(3)})`
            : locating
              ? "Detectando…"
              : "Compartiremos un punto difuso, no tu calle exacta."}
        </p>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" strokeWidth={2.2} />
          <p className="leading-snug">{error}</p>
        </div>
      )}

      <Btn
        kind="primaryVibrant"
        full
        size="lg"
        className="mt-4"
        onClick={onRequest}
        disabled={locating}
      >
        {locating ? "Detectando…" : error ? "Reintentar" : "Compartir ubicación"}
      </Btn>

      {(error || true) && (
        <div className="mt-5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-text-2">
            O elige una ciudad de referencia
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {CITIES.map((c) => (
              <button
                key={c.label}
                onClick={() => onPickFallback(c.coords)}
                className="rounded-md border border-line bg-white px-3 py-2.5 text-left text-sm text-text hover:bg-paper"
              >
                {c.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-text-2">
            Podrás corregirla más tarde desde el mapa.
          </p>
        </div>
      )}
    </div>
  );
}

function IdentityStep({
  alias,
  setAlias,
  displayName,
  setDisplayName,
  color,
  setColor,
  onContinue,
}: {
  alias: string;
  setAlias: (v: string) => void;
  displayName: string;
  setDisplayName: (v: string) => void;
  color: string;
  setColor: (v: string) => void;
  onContinue: () => void;
}) {
  const aliasNorm = alias.trim().toLowerCase();
  const aliasValid = ALIAS_RE.test(aliasNorm);
  const aliasTouched = alias.length > 0;
  const initials = (alias || "?").slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-1 flex-col px-6 pb-6">
      <h1 className="font-display text-3xl">Tu perfil</h1>
      <p className="mt-1 text-sm text-text-2">
        Así te verán los demás coleccionistas en el mapa.
      </p>

      <div className="mt-5 flex flex-col items-center">
        <div
          className="grid h-24 w-24 place-items-center rounded-full font-display text-4xl text-white shadow-sh2"
          style={{ background: color }}
        >
          {initials}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-text-2">
            Alias
          </span>
          <input
            value={alias}
            onChange={(e) => setAlias(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
            placeholder="alias_22"
            maxLength={24}
            autoComplete="username"
            aria-invalid={aliasTouched && !aliasValid}
            className={`mt-1 h-11 w-full rounded-md border bg-white px-3.5 text-sm outline-none focus:border-green-500 ${
              aliasTouched && !aliasValid ? "border-red-400" : "border-line"
            }`}
          />
          <span
            className={`mt-1 block text-[11px] ${
              aliasTouched && !aliasValid ? "text-red-600" : "text-text-2"
            }`}
          >
            3 a 24 caracteres. Solo minúsculas, números y _.
          </span>
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
            autoComplete="name"
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
                  type="button"
                  aria-pressed={active}
                  aria-label={`Color ${c}`}
                  className="grid aspect-square place-items-center rounded-full transition-transform"
                  style={{
                    background: c,
                    transform: active ? "scale(1.1)" : "scale(1)",
                    boxShadow: active
                      ? "0 0 0 3px rgba(11,28,18,0.92)"
                      : "0 1px 2px rgba(0,0,0,.12)",
                  }}
                >
                  {active && <Check size={14} className="text-white" strokeWidth={2.6} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-6">
        <Btn
          kind="primaryVibrant"
          full
          size="lg"
          disabled={!aliasValid}
          onClick={onContinue}
        >
          Continuar
        </Btn>
      </div>
    </div>
  );
}

function FavoriteStep({
  favorite,
  setFavorite,
  onContinue,
}: {
  favorite: string | null;
  setFavorite: (v: string | null) => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col px-6 pb-6">
      <h1 className="font-display text-3xl">Tu equipo favorito</h1>
      <p className="mt-1 text-sm text-text-2">
        Lo destacaremos en tu álbum. Puedes cambiarlo cuando quieras.
      </p>
      <div className="mt-5 grid flex-1 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
        {COUNTRIES.map((c) => {
          const active = favorite === c.code;
          return (
            <button
              key={c.code}
              onClick={() => setFavorite(c.code)}
              type="button"
              aria-pressed={active}
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
      <div className="pt-4">
        <Btn
          kind="primaryVibrant"
          full
          size="lg"
          disabled={!favorite}
          onClick={onContinue}
        >
          Continuar
        </Btn>
        <button
          onClick={onContinue}
          className="mt-2 block w-full text-center text-sm text-text-2"
        >
          Saltar
        </button>
      </div>
    </div>
  );
}

function FirstCromosStep({
  added,
  setAdded,
  pending,
  onFinish,
}: {
  added: Added[];
  setAdded: (updater: (prev: Added[]) => Added[]) => void;
  pending: boolean;
  onFinish: () => void;
}) {
  const adjust = (n: number, delta: number) => {
    setAdded((prev) => {
      const idx = prev.findIndex((x) => x.n === n);
      if (idx === -1) {
        if (delta <= 0) return prev;
        return [...prev, { n, count: delta }];
      }
      const nextCount = prev[idx].count + delta;
      if (nextCount <= 0) return prev.filter((x) => x.n !== n);
      const next = [...prev];
      next[idx] = { n, count: nextCount };
      return next;
    });
  };

  const totalAdded = added.reduce((s, a) => s + a.count, 0);
  const distinctAdded = added.length;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between px-5">
        <h1 className="font-display text-3xl">Primeros cromos</h1>
        <span className="font-display text-2xl text-green-700">{totalAdded}</span>
      </div>
      <p className="px-5 text-sm text-text-2">
        {distinctAdded === 0
          ? "Selecciona los cromos que ya tienes para encontrar matches."
          : `${distinctAdded} cromo${distinctAdded === 1 ? "" : "s"} distinto${distinctAdded === 1 ? "" : "s"} · ${totalAdded} en total`}
      </p>

      <FirstCromosPicker added={added} onAdjust={adjust} />

      <div className="border-t border-line bg-white px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-3">
        <Btn
          kind="primaryVibrant"
          full
          size="lg"
          disabled={pending}
          onClick={onFinish}
          icon={<ArrowRight size={16} />}
        >
          {pending
            ? "Guardando…"
            : distinctAdded >= 5
              ? "Empezar a buscar matches"
              : distinctAdded === 0
                ? "Saltar y añadir más tarde"
                : `Continuar con ${distinctAdded} cromo${distinctAdded > 1 ? "s" : ""}`}
        </Btn>
      </div>
    </div>
  );
}

type Tab = "selecciones" | "especiales" | "estadios";

function FirstCromosPicker({
  added,
  onAdjust,
}: {
  added: Added[];
  onAdjust: (n: number, delta: number) => void;
}) {
  const [tab, setTab] = useState<Tab>("selecciones");
  const [country, setCountry] = useState<string>("all");

  const addedMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const a of added) map.set(a.n, a.count);
    return map;
  }, [added]);

  const tabPool = useMemo(() => {
    if (tab === "especiales") return STICKERS.filter((s) => s.rarity !== "common");
    if (tab === "estadios") return STICKERS.filter((s) => s.type === "host_city");
    return STICKERS.filter(
      (s) => s.type === "team_badge" || s.type === "team_photo" || s.type === "player",
    );
  }, [tab]);

  const tabCountries = useMemo(() => {
    const codes = new Set(
      tabPool.map((s) => s.team_code).filter(Boolean) as string[],
    );
    return COUNTRIES.filter((c) => codes.has(c.code));
  }, [tabPool]);

  const list = useMemo(
    () => tabPool.filter((s) => country === "all" || s.team_code === country),
    [tabPool, country],
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex gap-5 border-b border-line px-5">
        {(["selecciones", "especiales", "estadios"] as const).map((id) => (
          <button
            key={id}
            onClick={() => {
              setTab(id);
              if (id !== "selecciones") setCountry("all");
            }}
            className={`-mb-px py-2 text-[14px] capitalize transition-colors ${
              tab === id
                ? "border-b-2 border-text font-bold text-text"
                : "border-b-2 border-transparent font-medium text-mute"
            }`}
          >
            {id}
          </button>
        ))}
      </div>

      <div className="scroll-hide flex gap-2 overflow-x-auto px-4 pb-1 pt-3">
        <Chip active={country === "all"} onClick={() => setCountry("all")}>
          <Globe size={14} strokeWidth={2} /> Todos
        </Chip>
        {tabCountries.map((c) => (
          <Chip
            key={c.code}
            active={country === c.code}
            onClick={() => setCountry(c.code)}
          >
            <Flag country={c} size={20} />
            {c.short}
          </Chip>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-3 gap-3 overflow-y-auto px-4 pb-4 pt-2 sm:grid-cols-4">
        {list.map((s) => (
          <CromoCard
            key={s.n}
            sticker={s}
            count={addedMap.get(s.n) ?? 0}
            size="sm"
            onAdjust={(d) => onAdjust(s.n, d)}
          />
        ))}
        {list.length === 0 && (
          <p className="col-span-3 py-10 text-center text-xs text-text-2">
            Sin cromos para esta selección
          </p>
        )}
      </div>
    </div>
  );
}
