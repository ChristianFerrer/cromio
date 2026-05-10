"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { signUpWithPassword } from "@/lib/auth/actions";
import { Btn } from "@/components/ui/Btn";
import { Logo } from "@/components/Logo";
import { AuthDivider, Field, GoogleButton } from "@/components/auth/AuthForm";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();

  const passwordMismatch = confirm.length > 0 && password !== confirm;
  const tooShort = password.length > 0 && password.length < 8;

  return (
    <main className="flex flex-1 flex-col px-6 pt-16">
      <div>
        <Logo size="lg" />
        <p className="mt-2 text-sm text-text-2">
          Crea tu cuenta y empieza a intercambiar.
        </p>
      </div>

      <form
        className="mt-8 space-y-3"
        action={(formData) => {
          setError(null);
          if (password !== confirm) {
            setError("Las contraseñas no coinciden.");
            return;
          }
          if (password.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres.");
            return;
          }
          startTransition(async () => {
            const result = await signUpWithPassword(formData);
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

        <Field icon={<Lock size={16} />} invalid={tooShort}>
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Contraseña (mín. 8 caracteres)"
            aria-invalid={tooShort}
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
        {tooShort && (
          <p className="-mt-1 text-[11px] text-red-600">
            Mínimo 8 caracteres.
          </p>
        )}

        <Field icon={<Lock size={16} />} invalid={passwordMismatch}>
          <input
            name="confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder="Confirma la contraseña"
            aria-invalid={passwordMismatch}
            className="h-11 w-full bg-transparent text-sm outline-none"
          />
        </Field>
        {passwordMismatch && (
          <p className="-mt-1 text-[11px] text-red-600">
            Las contraseñas no coinciden.
          </p>
        )}

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        )}

        <Btn
          kind="primaryVibrant"
          full
          size="lg"
          disabled={pending || passwordMismatch || tooShort || !password || !confirm}
        >
          {pending ? "Creando cuenta…" : "Crear cuenta"}
        </Btn>
      </form>

      <AuthDivider />

      <GoogleButton />

      <p className="mt-auto py-6 text-center text-sm text-text-2">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-green-700">
          Inicia sesión
        </Link>
      </p>

      <p className="pb-4 text-center text-[10px] text-mute">
        Al continuar aceptas que Cromio es una app no oficial sin afiliación con Panini Group ni FIFA.
      </p>
    </main>
  );
}
