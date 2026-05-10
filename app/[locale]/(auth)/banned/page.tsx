import { redirect } from "next/navigation";
import { ShieldOff, LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";

export const dynamic = "force-dynamic";

export default async function BannedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("banned_at, ban_reason")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.banned_at) redirect("/album");
  const t = await getTranslations("banned");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 pb-10 pt-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-red-50 text-red-600">
        <ShieldOff size={28} strokeWidth={2} />
      </span>
      <h1 className="mt-4 font-display text-2xl tracking-tight">
        {t("title")}
      </h1>
      <p className="mt-1 text-sm text-text-2">{t("subtitle")}</p>
      {profile.ban_reason && (
        <div className="mt-5 w-full max-w-sm rounded-md border border-line bg-white p-4 text-left text-sm">
          <p className="font-bold text-text">{t("reasonLabel")}</p>
          <p className="mt-1 text-text-2">{profile.ban_reason}</p>
        </div>
      )}
      <p className="mt-5 max-w-sm text-xs text-text-2">{t("contact")}</p>
      <form action={signOut} className="mt-6">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-semibold text-text"
        >
          <LogOut size={16} /> {t("signOut")}
        </button>
      </form>
    </main>
  );
}
