import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata = {
  title: "Cromio · Cromos del Mundial 2026, sin envíos",
  description:
    "Cromio empareja por proximidad a coleccionistas del álbum del Mundial 2026. Sin envíos, sin estafas online, sin comisiones.",
};

// Root del locale: si el usuario está logueado redirige a /album, si no
// renderiza la landing. La copia de landing vive en LandingPage para que
// /landing (ruta pública y sin redirect) pueda reusarla idéntica.
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const prefix = locale === "es" ? "" : `/${locale}`;
  if (user) redirect(`${prefix}/album`);
  return <LandingPage locale={locale} />;
}
