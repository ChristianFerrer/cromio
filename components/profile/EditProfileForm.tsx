"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Camera, Check, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/lib/profile/actions";
import { pushAppToast } from "@/lib/notifications/toast";
import { Btn } from "@/components/ui/Btn";
import { IconBtn } from "@/components/ui/IconBtn";

const COLORS = [
  "#01F78B", // Cromio mint (logo)
  "#0F97BD", // Cromio teal (logo)
  "#007A47", // Cromio green dark
  "#2D7DD8",
  "#7B5BD8",
  "#D7263D",
  "#E5006D",
  "#D4AF37",
  "#E78C2E",
];

const ALIAS_RE = /^[a-z0-9_]{3,24}$/;

type Initial = {
  alias: string;
  display_name: string;
  avatar_url: string | null;
  color: string;
};

export function EditProfileForm({
  userId,
  initial,
}: {
  userId: string;
  initial: Initial;
}) {
  const router = useRouter();
  const [alias, setAlias] = useState(initial.alias);
  const [displayName, setDisplayName] = useState(initial.display_name);
  const [color, setColor] = useState(initial.color);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatar_url);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const aliasNorm = alias.trim().toLowerCase();
  const aliasValid = ALIAS_RE.test(aliasNorm);
  const aliasTouched = alias.length > 0;

  const dirty =
    aliasNorm !== initial.alias ||
    displayName.trim() !== initial.display_name.trim() ||
    color !== initial.color ||
    avatarUrl !== initial.avatar_url;

  // Warn on hard navigation away with unsaved changes.
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

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Sube una imagen");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("La imagen debe pesar menos de 3MB");
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) {
        setError(upErr.message);
        return;
      }
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(pub.publicUrl);
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = () => setAvatarUrl(null);

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
        color,
        avatar_url: avatarUrl,
      });
      if (result?.error) {
        const msg =
          result.error === "alias_taken"
            ? "Ese alias ya está en uso"
            : result.error === "invalid_alias"
              ? "Alias no válido"
              : result.error === "invalid_color"
                ? "Color no válido"
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
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={alias}
              className="h-24 w-24 rounded-full object-cover shadow-sh2"
            />
          ) : (
            <div
              className="grid h-24 w-24 place-items-center rounded-full font-display text-4xl text-white shadow-sh2"
              style={{ background: color }}
            >
              {initials}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-white text-text shadow-sh2 disabled:opacity-50"
            aria-label="Subir foto"
          >
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Camera size={16} strokeWidth={2.2} />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </div>
        {avatarUrl && (
          <button
            onClick={removeAvatar}
            className="mt-2 flex items-center gap-1 text-xs text-text-2"
          >
            <Trash2 size={12} /> Quitar foto
          </button>
        )}
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
          disabled={pending || uploading || !dirty || !aliasValid}
          onClick={save}
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </Btn>
      </div>
    </main>
  );
}
