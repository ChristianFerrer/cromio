"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { updateUser } from "@/lib/admin/users";
import { pushAppToast } from "@/lib/notifications/toast";

type Props = {
  userId: string;
  alias: string;
  displayName: string | null;
  color: string | null;
  plan: string | null;
  bio: string | null;
};

export function UserEditForm({
  userId,
  alias,
  displayName,
  color,
  plan,
  bio,
}: Props) {
  const t = useTranslations("admin.users");
  const tErr = useTranslations("admin.errors");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    alias,
    display_name: displayName ?? "",
    color: color ?? "#10C56A",
    plan: plan ?? "free",
    bio: bio ?? "",
  });

  const dirty =
    form.alias !== alias ||
    form.display_name !== (displayName ?? "") ||
    form.color !== (color ?? "#10C56A") ||
    form.plan !== (plan ?? "free") ||
    form.bio !== (bio ?? "");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty) return;
    startTransition(async () => {
      const r = await updateUser(userId, {
        alias: form.alias.trim(),
        display_name: form.display_name.trim() || null,
        color: form.color,
        plan: form.plan,
        bio: form.bio.trim() || null,
      });
      if (!r.ok) {
        pushAppToast({ kind: "error", body: r.error ?? tErr("generic") });
        return;
      }
      pushAppToast({ kind: "success", body: "OK" });
      router.refresh();
    });
  };

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 space-y-3 rounded-md border border-line bg-white p-4"
    >
      <Field label="Alias">
        <input
          value={form.alias}
          onChange={update("alias")}
          className="h-9 w-full rounded-md border border-line px-2 text-sm outline-none focus:border-green-700"
        />
      </Field>
      <Field label="Display name">
        <input
          value={form.display_name}
          onChange={update("display_name")}
          className="h-9 w-full rounded-md border border-line px-2 text-sm outline-none focus:border-green-700"
        />
      </Field>
      <Field label="Color">
        <input
          type="color"
          value={form.color}
          onChange={update("color")}
          className="h-9 w-16 rounded-md border border-line"
        />
      </Field>
      <Field label="Plan">
        <select
          value={form.plan}
          onChange={update("plan")}
          className="h-9 w-full rounded-md border border-line bg-white px-2 text-sm outline-none focus:border-green-700"
        >
          <option value="free">free</option>
          <option value="pro">pro</option>
        </select>
      </Field>
      <Field label="Bio">
        <textarea
          value={form.bio}
          onChange={update("bio")}
          rows={3}
          className="w-full rounded-md border border-line p-2 text-sm outline-none focus:border-green-700"
        />
      </Field>
      <button
        type="submit"
        disabled={!dirty || isPending}
        className="h-10 rounded-md bg-green-700 px-4 text-sm font-bold text-white disabled:opacity-50"
      >
        {dirty ? t("detail.saveChanges") : t("detail.noChanges")}
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-text-2">
        {label}
      </span>
      {children}
    </label>
  );
}
