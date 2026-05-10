import { getTranslations } from "next-intl/server";

export default async function AdminUsersStub() {
  const t = await getTranslations("admin");
  return (
    <section className="rounded-md border border-line bg-white p-6 text-sm text-text-2">
      {t("users.title")} — próximamente
    </section>
  );
}
