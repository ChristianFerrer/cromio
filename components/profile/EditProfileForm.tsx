"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { updateProfile } from "@/lib/profile/actions";
import { pushAppToast } from "@/lib/notifications/toast";
import { Btn } from "@/components/ui/Btn";
import { IconBtn } from "@/components/ui/IconBtn";

const ALIAS_RE = /^[a-z0-9_]{3,24}$/;

type Initial = {
  alias: string;
  display_name: string;
};

export function EditProfileForm({
  initial,
}: {
  userId: string;
  initial: Initial;
}) {
  const router = useRouter();
  const [alias, setAlias] = useState(initial.alias);
  const [displayName, setDisplayName] = useState(initial.display_name);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const aliasNorm = alias.trim().toLowerCase();
  const aliasValid = ALIAS_RE.test(aliasNorm);
  const aliasTouched = alias.length > 0;

  const dirty =
    aliasNorm !== initial.alias ||
    displayName.trim() !== initial.display_name.trim();

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const goBack = () => {
    if (dirty && !window.confirm("Tienes cambios sin guardar. ¿Salir igualmente?")) {
      return;
    }
    if (window.history.length > 1) router.back();
    else router.push("/perfil");
  };

  const save = () => {
    setError(null);
    if (!aliasValid) {
      setError("El alias debe tener 3-24 caracteres (letras, números o _)");
      return;
    }
    startTransition(async () => {
      const result = await updateProfile({
        alias: aliasNorm,
        display_name: displayName,
      });
      if (result?.error) {
        const msg =
          result.error === "alias_taken"
            ? "Ese alias ya está en uso"
            : result.error === "invalid_alias"
              ? "Alias no válido"
              : result.error;
        setError(msg);
        pushAppToast({ kind: "error", title: "No se pudo guardar", body: msg });
        return;
      }
      pushAppToast({ kind: "success", body: "Perfil actualizado" });
      router.replace("/perfil");
      router.refresh();
    });
  };

  const initials = (alias || "?").slice(0, 2).toUpperCase();

  return (
    <main className="flex min-h-dvh flex-col px-5 pb-10 pt-14">
      <div className="flex items-center gap-2">
        <IconBtn ariaLabel="Atrás" onClick={goBack}>
          <ChevronLeft size={18} strokeWidth={2} />
        </IconBtn>
        <h1 className="font-display text-2xl">Editar perfil</h1>
      </div>

      <section className="mt-6 flex flex-col items-center">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-green-500 font-display text-4xl text-white shadow-sh2">
          {initials}
        </div>
      </section>

      <div className="mt-6 space-y-4">
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
            className="mt-1 h-11 w-full rounded-md border border-line bg-white px-3.5 text-sm outline-none focus:border-green-500"
          />
        </label>
      </div>

      {error && (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <div className="mt-auto pt-6">
        <Btn
          kind="primaryVibrant"
          full
          size="lg"
          disabled={pending || !dirty || !aliasValid}
          onClick={save}
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </Btn>
      </div>
    </main>
  );
}
