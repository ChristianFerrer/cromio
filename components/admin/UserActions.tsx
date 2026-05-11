"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Ban,
  Download,
  KeyRound,
  LogOut,
  ShieldCheck,
  ShieldOff,
  Trash2,
} from "lucide-react";
import {
  banUser,
  deleteUser,
  exportUserData,
  forceSignOut,
  sendPasswordReset,
  setAdminFlag,
  unbanUser,
} from "@/lib/admin/users";
import { pushAppToast } from "@/lib/notifications/toast";

type Props = {
  userId: string;
  isBanned: boolean;
  isAdmin: boolean;
  alias: string;
  isSelf: boolean;
};

export function UserActions({ userId, isBanned, isAdmin, alias, isSelf }: Props) {
  const t = useTranslations("admin.users");
  const tErr = useTranslations("admin.errors");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [banReason, setBanReason] = useState("");
  const [showBanForm, setShowBanForm] = useState(false);
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deleteAlias, setDeleteAlias] = useState("");

  const handle = async (action: () => Promise<{ ok: boolean; error?: string }>) => {
    startTransition(async () => {
      try {
        const r = await action();
        if (!r.ok) {
          const code = r.error ?? "generic";
          const msg =
            code === "selfBan" || code === "selfDemote" || code === "selfDelete"
              ? tErr(code)
              : (r.error ?? tErr("generic"));
          pushAppToast({ kind: "error", body: msg });
          return;
        }
        pushAppToast({ kind: "success", body: "OK" });
        router.refresh();
      } catch (e) {
        pushAppToast({
          kind: "error",
          body: e instanceof Error ? e.message : tErr("generic"),
        });
      }
    });
  };

  const onDelete = () => {
    startTransition(async () => {
      try {
        const r = await deleteUser(userId);
        if (!r.ok) {
          const code = r.error ?? "generic";
          const msg =
            code === "selfDelete" ? tErr(code) : (r.error ?? tErr("generic"));
          pushAppToast({ kind: "error", body: msg });
          return;
        }
        pushAppToast({ kind: "success", body: t("detail.deleted") });
        router.replace("/admin/usuarios");
      } catch (e) {
        pushAppToast({
          kind: "error",
          body: e instanceof Error ? e.message : tErr("generic"),
        });
      }
    });
  };

  const onExport = () => {
    startTransition(async () => {
      const r = await exportUserData(userId);
      if (!r.ok || !r.data) {
        pushAppToast({ kind: "error", body: r.ok ? tErr("generic") : (r as { error?: string }).error ?? tErr("generic") });
        return;
      }
      const blob = new Blob([JSON.stringify(r.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cromio-user-${alias}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      pushAppToast({ kind: "success", body: "Export OK" });
    });
  };

  return (
    <section className="mt-6 rounded-md border border-red-200 bg-red-50/50 p-4">
      <h3 className="mb-3 font-display text-base text-red-700">
        {t("detail.danger")}
      </h3>

      {!isBanned ? (
        <div className="space-y-2">
          {!showBanForm ? (
            <button
              type="button"
              disabled={isPending || isSelf}
              onClick={() => setShowBanForm(true)}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-red-600 px-3 text-sm font-bold text-white disabled:opacity-50"
            >
              <Ban size={14} /> {t("actions.ban")}
            </button>
          ) : (
            <div className="rounded-md border border-line bg-white p-3">
              <label className="block text-xs font-bold text-text">
                {t("detail.banReasonLabel")}
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder={t("detail.banReasonPlaceholder")}
                rows={3}
                className="mt-1 w-full rounded-md border border-line p-2 text-sm outline-none focus:border-red-500"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowBanForm(false)}
                  className="h-9 rounded-md border border-line bg-white px-3 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isPending || !banReason.trim()}
                  onClick={() => handle(() => banUser(userId, banReason))}
                  className="h-9 rounded-md bg-red-600 px-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {t("detail.confirmBan")}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={isPending}
          onClick={() => handle(() => unbanUser(userId))}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-green-700 px-3 text-sm font-bold text-white disabled:opacity-50"
        >
          <ShieldCheck size={14} /> {t("detail.confirmUnban")}
        </button>
      )}

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => handle(() => forceSignOut(userId))}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-medium text-text disabled:opacity-50"
        >
          <LogOut size={14} /> {t("actions.forceSignOut")}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => handle(() => sendPasswordReset(userId))}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-medium text-text disabled:opacity-50"
        >
          <KeyRound size={14} /> {t("actions.sendReset")}
        </button>
        <button
          type="button"
          disabled={isPending || isSelf}
          onClick={() =>
            handle(() => setAdminFlag(userId, !isAdmin))
          }
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-medium text-text disabled:opacity-50"
        >
          {isAdmin ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
          {isAdmin ? t("actions.demote") : t("actions.promote")}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={onExport}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-medium text-text disabled:opacity-50"
        >
          <Download size={14} /> {t("actions.exportData")}
        </button>
      </div>

      <div className="mt-4 border-t border-red-200 pt-4">
        {!showDeleteForm ? (
          <button
            type="button"
            disabled={isPending || isSelf}
            onClick={() => {
              setDeleteAlias("");
              setShowDeleteForm(true);
            }}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-red-600 bg-white px-3 text-sm font-bold text-red-700 disabled:opacity-50"
          >
            <Trash2 size={14} /> {t("actions.delete")}
          </button>
        ) : (
          <div className="rounded-md border border-red-300 bg-white p-3">
            <p className="text-xs leading-snug text-red-700">
              {t("detail.deleteWarning")}
            </p>
            <label className="mt-3 block text-xs font-bold text-text">
              {t("detail.deleteConfirmAlias", { alias })}
            </label>
            <input
              value={deleteAlias}
              onChange={(e) => setDeleteAlias(e.target.value)}
              autoComplete="off"
              placeholder={alias}
              className="mt-1 w-full rounded-md border border-line p-2 text-sm outline-none focus:border-red-500"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteForm(false);
                  setDeleteAlias("");
                }}
                className="h-9 rounded-md border border-line bg-white px-3 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending || deleteAlias.trim() !== alias}
                onClick={onDelete}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-red-700 px-3 text-sm font-bold text-white disabled:opacity-50"
              >
                <Trash2 size={14} /> {t("detail.confirmDelete")}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
