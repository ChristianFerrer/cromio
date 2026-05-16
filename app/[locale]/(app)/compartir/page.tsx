import QRCode from "qrcode";
import Image from "next/image";
import { ShareActions } from "@/components/share/ShareActions";
import { PageHeader } from "@/components/PageHeader";

// Landing pública, independiente del estado de auth. Para que el
// destinatario siempre vea el pitch y no la app — ver
// app/[locale]/landing/page.tsx.
const SHARE_URL = "https://cromio-one.vercel.app/landing";

const COPY = {
  es: {
    title: "Comparte Cromio",
    sub: "Encuentra coleccionistas a tu alrededor y cambia cromos en persona. Cuantos más usen Cromio, más matches tendrás.",
    card: {
      name: "CROMIO",
      tag: "Cromos del Mundial 2026, sin envíos",
      scan: "Escanea para instalar",
    },
    divider: "o enviar por",
    whatsapp: "Enviar por WhatsApp",
    copy: "Copiar enlace",
    more: "Más opciones",
    shareText:
      "Te recomiendo Cromio: encuentra coleccionistas cerca para cambiar los cromos del Mundial 2026. Sin envíos, sin pasta.",
  },
  en: {
    title: "Share Cromio",
    sub: "Find sticker collectors around you and trade in person. The more people use Cromio, the more matches you get.",
    card: {
      name: "CROMIO",
      tag: "2026 World Cup stickers, no shipping",
      scan: "Scan to install",
    },
    divider: "or send via",
    whatsapp: "Send by WhatsApp",
    copy: "Copy link",
    more: "More options",
    shareText:
      "Try Cromio: find sticker collectors nearby and trade in person. No shipping, no fees.",
  },
} as const;

export default async function CompartirPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = COPY[locale === "en" ? "en" : "es"];

  // QR generado en build/server. Margen mínimo, alto contraste,
  // tamaño grande (las dimensiones reales las controla el <img>).
  const qrDataUrl = await QRCode.toDataURL(SHARE_URL, {
    margin: 1,
    width: 600,
    color: { dark: "#0e0e0e", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });

  return (
    <main className="pb-6">
      <PageHeader title={t.title} />
      <div className="px-5 pt-4">
        <p className="text-sm leading-snug text-text-2">{t.sub}</p>
        {/* Card central con logo + QR — verde Cromio */}
        <div className="mt-5 rounded-2xl bg-green-500 px-6 py-7 text-center text-white shadow-sh2">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-sh1">
            <Image
              src="/radar_cromio.png"
              alt="Cromio"
              width={32}
              height={32}
              priority
            />
          </div>
          <h2 className="mt-3 font-display text-2xl tracking-tight text-white">
            {t.card.name}
          </h2>
          <p className="text-xs font-semibold text-white/90">{t.card.tag}</p>

          <div className="mx-auto mt-5 inline-block rounded-2xl bg-white p-3 shadow-sh1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="QR para instalar Cromio"
              width={240}
              height={240}
              className="block h-60 w-60"
            />
          </div>
          <p className="mt-3 text-sm font-bold text-white">{t.card.scan}</p>
        </div>

        {/* Divider */}
        <div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-wider text-text-2">
          <div className="h-px flex-1 bg-line" />
          <span>{t.divider}</span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <ShareActions
          url={SHARE_URL}
          shareText={t.shareText}
          whatsappCopy={t.whatsapp}
          copyCopy={t.copy}
          moreCopy={t.more}
        />
      </div>
    </main>
  );
}
