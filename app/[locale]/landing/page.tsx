import { LandingPage } from "@/components/landing/LandingPage";

export const metadata = {
  title: "Cromio · Cromos del Mundial 2026, sin envíos",
  description:
    "Cromio empareja por proximidad a coleccionistas del álbum del Mundial 2026. Sin envíos, sin estafas online, sin comisiones.",
};

// Ruta pública independiente del estado de auth. Útil para compartir
// el link en campañas y grupos: el destinatario siempre verá la landing
// (no la app), incluso si ya está logueado en otra pestaña. El root /
// del locale sí redirige a /album cuando hay sesión activa.
export default async function LandingRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <LandingPage locale={locale} />;
}
