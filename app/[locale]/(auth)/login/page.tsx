"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { signInWithPassword } from "@/lib/auth/actions";
import { Btn } from "@/components/ui/Btn";
import { AuthDivider, Field, GoogleButton } from "@/components/auth/AuthForm";

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
            autoFocus
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

        <p className="pt-1 text-center text-xs text-text-2">
          <Link href="/login/recuperar" className="font-semibold text-green-700">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
      </form>

      <AuthDivider />

      <GoogleButton />

      <p className="mt-auto py-6 text-center text-sm text-text-2">
        ¿No tienes cuenta?{" "}
        <Link href="/signup" className="font-semibold text-green-700">
          Crea una
        </Link>
      </p>
    </main>
  );
}
