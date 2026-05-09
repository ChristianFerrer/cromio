import { useTranslations } from "next-intl";

export default function AlbumPage() {
  const t = useTranslations();
  return (
    <main className="px-5 pt-14">
      <header className="pt-2">
        <h1 className="font-display text-3xl tracking-tight">
          {t("common.appName")}
        </h1>
        <p className="mt-1 text-xs uppercase tracking-wider text-text-2">
          {t("album.subtitle")}
        </p>
      </header>

      <section className="mt-6 rounded-card border border-line bg-white p-5 shadow-sh1">
        <div className="font-display text-5xl leading-none text-text">0</div>
        <div className="mt-1 text-sm text-text-2">/ 980 cromos · 0%</div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-line">
          <div className="h-full w-0 bg-gradient-to-r from-green-700 to-green-500" />
        </div>
        <p className="mt-4 text-sm text-mute">
          {t("common.comingSoon")} — sección {t("nav.album")}
        </p>
      </section>
    </main>
  );
}
