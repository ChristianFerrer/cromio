"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { signInWithPassword } from "@/lib/auth/actions";
import { signInWithGoogle } from "@/lib/auth/oauth";
import { Btn } from "@/components/ui/Btn";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <main className="flex flex-1 flex-col px-6 pt-16">
      <div>
        <h1 className="font-display text-5xl tracking-tight">CROMIO</h1>
        <p className="mt-1 text-sm text-text-2">Bienvenido de vuelta.</p>
      </div>

      <form
        className="mt-8 space-y-3"
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            const result = await signInWithPassword(formData);
            if (result?.error) setError(result.error);
          });
        }}
      >
        <Field icon={<Mail size={16} />}>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="tu@email.com"
            className="h-11 w-full bg-transparent text-sm outline-none"
          />
        </Field>
        <Field icon={<Lock size={16} />}>
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="Contraseña"
            className="h-11 w-full bg-transparent text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-text-2"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </Field>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        )}

        <Btn kind="primaryVibrant" full size="lg" disabled={pending}>
          {pending ? "Entrando…" : "Iniciar sesión"}
        </Btn>
      </form>

      <div className="mt-6 flex items-center gap-3 text-[11px] uppercase tracking-wider text-mute">
        <div className="h-px flex-1 bg-line" />
        <span>o</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <button
        type="button"
        onClick={() => signInWithGoogle()}
        className="mt-4 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-line bg-white text-sm font-semibold text-text"
      >
        <GoogleLogo />
        Continuar con Google
      </button>

      <p className="mt-auto py-6 text-center text-sm text-text-2">
        ¿No tienes cuenta?{" "}
        <Link href="/signup" className="font-semibold text-green-700">
          Crea una
        </Link>
      </p>
    </main>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 rounded-md border border-line bg-white px-3.5 focus-within:border-green-500">
      <span className="text-text-2">{icon}</span>
      {children}
    </label>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.79 2.71v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.61z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26a5.4 5.4 0 0 1-3.06.86 5.4 5.4 0 0 1-5.07-3.74H.96v2.33A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.93 10.71A5.41 5.41 0 0 1 3.65 9c0-.6.1-1.18.28-1.71V4.96H.96A9 9 0 0 0 0 9a9 9 0 0 0 .96 4.04l2.97-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58A8.95 8.95 0 0 0 9 0a9 9 0 0 0-8.04 4.96l2.97 2.33A5.4 5.4 0 0 1 9 3.58z"/>
    </svg>
  );
}
