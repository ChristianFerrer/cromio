import { useTranslations } from "next-intl";

export default function ChatPage() {
  const t = useTranslations();
  return (
    <main className="px-5 pt-14">
      <header className="pt-2">
        <h1 className="font-display text-3xl tracking-tight">
          {t("nav.chat")}
        </h1>
      </header>
      <p className="mt-6 text-sm text-text-2">{t("chat.empty")}</p>
    </main>
  );
}
