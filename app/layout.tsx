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
  title: "Cromio — Mundial 2026",
  description:
    "Encuentra coleccionistas del álbum Panini Mundial 2026 cerca de ti. Intercambia cromos en persona.",
  manifest: "/manifest.webmanifest",
  applicationName: "Cromio",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cromio",
    startupImage: ["/icon.svg"],
  },
  icons: {
    icon: [
      { url: "/cromio_icon.png", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/cromio_icon.png",
    apple: "/cromio_icon.png",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#066B40",
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
