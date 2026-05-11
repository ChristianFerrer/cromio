"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  MapPin,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Btn } from "@/components/ui/Btn";
import { IconBtn } from "@/components/ui/IconBtn";
import { createClient } from "@/lib/supabase/client";

const STEPS = ["location", "identity"] as const;
type Step = (typeof STEPS)[number];

const STEP_TITLES: Record<Step, string> = {
  location: "Ubicación",
  identity: "Tu perfil",
};

const DEFAULT_COLOR = "#26C6DA";
const ALIAS_RE = /^[a-z0-9_]{3,24}$/;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("location");
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [alias, setAlias] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
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
      <div className="flex w-16 items-center gap-1">
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
    </div>
  );
}

function IdentityStep({
  alias,
  setAlias,
  displayName,
  setDisplayName,
  color,
  pending,
  onFinish,
}: {
  alias: string;
  setAlias: (v: string) => void;
  displayName: string;
  setDisplayName: (v: string) => void;
  color: string;
  pending: boolean;
  onFinish: () => void;
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
      </div>

      <div className="mt-auto pt-6">
        <Btn
          kind="primaryVibrant"
          full
          size="lg"
          disabled={!aliasValid || pending}
          onClick={onFinish}
        >
          {pending ? "Guardando…" : "Empezar a buscar matches"}
        </Btn>
      </div>
    </div>
  );
}
