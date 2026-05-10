import Link from "next/link";
import { ShieldCheck, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getIsAdmin } from "@/lib/admin/guards";

export async function AdminLink() {
  const isAdmin = await getIsAdmin();
  if (!isAdmin) return null;
  const t = await getTranslations("admin");

  return (
    <Link
      href="/admin/dashboard"
      className="mt-5 flex items-center gap-3 rounded-md border border-line bg-white p-4 hover:bg-paper"
    >
      <span className="grid h-9 w-9 place-items-center rounded-full bg-green-50 text-green-700">
        <ShieldCheck size={18} strokeWidth={2.2} />
      </span>
      <span className="flex-1">
        <span className="block font-display text-base text-text">
          {t("entryTitle")}
        </span>
        <span className="block text-xs text-text-2">{t("entrySubtitle")}</span>
      </span>
      <ChevronRight size={18} className="text-text-2" />
    </Link>
  );
}
