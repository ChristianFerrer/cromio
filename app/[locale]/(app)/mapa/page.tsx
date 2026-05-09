import { useTranslations } from "next-intl";

export default function MapaPage() {
  const t = useTranslations();
  return (
    <main className="px-5 pt-14">
      <header className="pt-2">
        <h1 className="font-display text-3xl tracking-tight">
          {t("nav.mapa")}
        </h1>
      </header>
      <section className="mt-6 grid h-[60vh] place-items-center rounded-card border border-line bg-paper text-mute">
        <p>{t("common.comingSoon")} — MapLibre + radar</p>
      </section>
    </main>
  );
}
