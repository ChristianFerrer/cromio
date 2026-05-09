import { redirect } from "next/navigation";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const prefix = locale === "es" ? "" : `/${locale}`;
  redirect(`${prefix}/album`);
}
