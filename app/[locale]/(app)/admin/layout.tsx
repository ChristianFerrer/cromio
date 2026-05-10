import Link from "next/link";
import { BarChart3, Users, ShieldCheck, ScrollText } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin/guards";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  const t = await getTranslations("admin");

  const tabs = [
    { href: "/admin/dashboard", label: t("nav.dashboard"), icon: BarChart3 },
    { href: "/admin/usuarios", label: t("nav.users"), icon: Users },
    { href: "/admin/auditoria", label: t("nav.audit"), icon: ScrollText },
  ];

  return (
    <main className="pb-6">
      <header className="sticky top-0 z-10 border-b border-line bg-bone/95 px-5 pb-3 pt-12 backdrop-blur">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} strokeWidth={2.2} className="text-green-700" />
          <h1 className="font-display text-2xl tracking-tight">{t("title")}</h1>
        </div>
        <nav
          aria-label="Admin"
          className="-mx-1 mt-3 flex gap-1 overflow-x-auto"
        >
          {tabs.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-line bg-white px-3 py-1.5 text-sm font-medium text-text-2 hover:bg-paper hover:text-text"
            >
              <Icon size={14} strokeWidth={2} aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="px-4 pt-4 md:px-6">{children}</div>
    </main>
  );
}
