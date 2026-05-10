"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, Mail, MailCheck } from "lucide-react";
import { requestPasswordReset } from "@/lib/auth/actions";
import { Btn } from "@/components/ui/Btn";
import { Field } from "@/components/auth/AuthForm";
import { IconLink } from "@/components/ui/IconBtn";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <main className="flex flex-1 flex-col px-6 pt-14">
      <div className="flex items-center gap-3">
        <IconLink href="/login" ariaLabel="Volver a inicio de sesión">
          <ChevronLeft size={18} strokeWidth={2} />
        </IconLink>
        <h1 className="font-display text-3xl">Recuperar contraseña</h1>
      </div>
      <p className="mt-2 text-sm text-text-2">
        Te enviamos un enlace para crear una nueva contraseña.
      </p>

      {sent ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl bg-green-50 p-8 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-green-500 text-white">
            <MailCheck size={28} strokeWidth={2.2} />
          </div>
          <p className="mt-4 font-bold text-green-700">Email enviado</p>
          <p className="mt-1 text-xs text-text-2">
            Revisa tu bandeja de entrada y sigue el enlace para restablecer la contraseña.
          </p>
          <Link
            href="/login"
            className="mt-5 text-sm font-semibold text-green-700"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      ) : (
        <form
          className="mt-8 space-y-3"
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              const result = await requestPasswordReset(formData);
              if (result?.error) setError(result.error);
              else setSent(true);
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
          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          )}
          <Btn kind="primaryVibrant" full size="lg" disabled={pending}>
            {pending ? "Enviando…" : "Enviar enlace"}
          </Btn>
        </form>
      )}
    </main>
  );
}
