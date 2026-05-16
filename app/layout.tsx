import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cromio · Intercambia cromos a tu alrededor",
  description:
    "Encuentra coleccionistas a tu alrededor e intercambia cromos en persona. Sin envíos, sin intermediarios.",
  manifest: "/manifest.webmanifest",
  applicationName: "Cromio",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cromio",
    startupImage: ["/cromio_icon.png"],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/cromio_icon.png", type: "image/png" },
    ],
    shortcut: "/icon.svg",
    apple: "/cromio_icon.png",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#1FAE5A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      className={`${bebas.variable} ${inter.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
