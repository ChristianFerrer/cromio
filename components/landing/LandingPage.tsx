import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Shield,
  Bell,
  Trophy,
  Layers,
  Radar,
  Handshake,
  Mail,
} from "lucide-react";
import { Btn } from "@/components/ui/Btn";
import { InstallInstructions } from "@/components/landing/InstallInstructions";

type Locale = "es" | "en";

const COPY = {
  es: {
    nav: { login: "Entrar", signup: "Crear cuenta" },
    hero: {
      h1: "Encuentra coleccionistas cerca de ti",
      sub: "Intercambia los cromos del Mundial 2026 en persona, sin envíos ni intermediarios. Cromio te muestra coleccionistas a tu alrededor.",
      cta1: "Crear cuenta",
      cta2: "Entrar",
      meta: "Gratis · iPhone, Android y escritorio · Sin app store",
    },
    what: {
      title: "¿Qué es Cromio?",
      body:
        "Cromio es una comunidad por proximidad para coleccionistas del álbum del Mundial 2026. En vez de buscar en marketplaces, grupos o chats, te muestra en tiempo real quién a tu alrededor tiene lo que te falta y necesita lo que tienes repetido.",
      kpis: [
        { label: "Cromos en el álbum", value: "980" },
        { label: "Selecciones", value: "48" },
        { label: "Sedes Mundial 2026", value: "16" },
      ],
    },
    how: {
      title: "Cómo funciona",
      steps: [
        {
          icon: "layers",
          title: "Cargar tu álbum",
          body: "Marca los cromos que tienes. Cromio hace el resto.",
        },
        {
          icon: "radar",
          title: "Activa el radar",
          body: "Elige el radio de búsqueda o agrega contactos directos. Cromio identifica qué te falta y quién lo tiene.",
        },
        {
          icon: "handshake",
          title: "Queda y cambia",
          body: "Chat directo, planifica dónde verse y valoráis al terminar. Sin complicaciones.",
        },
      ],
    },
    why: {
      title: "Por qué Cromio",
      items: [
        {
          icon: "map",
          title: "Cercanía real",
          body: "Sin esperar paquetes ni pagar gastos de envío. Cambias hoy.",
        },
        {
          icon: "shield",
          title: "Privado",
          body: "Tu calle exacta no se comparte. Solo guardamos un punto difuso.",
        },
        {
          icon: "bell",
          title: "Avisos al instante",
          body: "Notificaciones push cuando aparezca alguien con tu match.",
        },
        {
          icon: "trophy",
          title: "Pensado para el Mundial",
          body: "Las 48 selecciones, 16 sedes y los 17 cromos especiales.",
        },
      ],
    },
    install: {
      title: "Instálalo como app",
      sub: "Cromio funciona como aplicación nativa en cualquier teléfono. Es la mejor experiencia y la única forma de recibir notificaciones push.",
      tabs: { ios: "iPhone / iPad", android: "Android", desktop: "Escritorio" },
      ios: [
        "Abre cromio.app en Safari (no en otro navegador).",
        "Pulsa el botón Compartir (cuadrado con flecha hacia arriba).",
        "Elige «Añadir a pantalla de inicio».",
        "Confirma con «Añadir». Abre Cromio desde el icono nuevo.",
      ],
      iosNote: "iOS 16.4 o superior para notificaciones push.",
      android: [
        "Abre cromio.app en Chrome.",
        "Pulsa el menú ⋮ arriba a la derecha.",
        "Elige «Instalar aplicación» (o «Añadir a pantalla principal»).",
        "Confirma con «Instalar» y permite las notificaciones cuando aparezcan.",
      ],
      androidNote: "Recuerda permitir las notificaciones cuando te lo pida Chrome.",
      desktop: [
        "Abre cromio.app en Chrome, Edge o Brave.",
        "Mira el icono de instalación en el lado derecho de la barra de direcciones.",
        "Pulsa «Instalar» y confirma.",
      ],
      desktopNote: "También funciona como sitio web normal sin instalar nada.",
    },
    cta: {
      title: "Empieza a completar tu álbum",
      sub: "Crea una cuenta gratis. Solo necesitas tu zona y un alias.",
      cta1: "Crear cuenta",
      cta2: "Ya tengo cuenta",
    },
    footer: {
      tagline: "Comunidad de coleccionistas · Mundial 2026",
      about: "Sobre",
      terms: "Términos",
      privacy: "Privacidad",
      email: "hola@cromio.app",
      disclaimer:
        "Cromio es una app independiente, sin afiliación con FIFA ni con la editorial del álbum oficial. Los nombres y diseños de los cromos pertenecen a sus respectivos titulares.",
    },
  },
  en: {
    nav: { login: "Sign in", signup: "Sign up" },
    hero: {
      h1: "Find sticker collectors near you",
      sub: "Trade 2026 World Cup stickers in person — no shipping, no middlemen, no fees. Cromio pairs you with collectors in your neighborhood.",
      cta1: "Sign up",
      cta2: "Sign in",
      meta: "Free · iPhone, Android, desktop · No app store",
    },
    what: {
      title: "What is Cromio?",
      body:
        "Cromio is a proximity community for collectors of the 2026 World Cup album. Instead of trawling marketplaces, you find someone in your neighborhood who has what you need and needs what you have spare.",
      kpis: [
        { label: "Stickers in album", value: "980" },
        { label: "National teams", value: "48" },
        { label: "Host venues", value: "16" },
      ],
    },
    how: {
      title: "How it works",
      steps: [
        {
          icon: "layers",
          title: "Load your album",
          body: "Mark which stickers you have and which are missing. The digital album syncs in real time.",
        },
        {
          icon: "radar",
          title: "Switch on the radar",
          body: "Pick a radius (200m–10km) and discover nearby collectors who match: you give, they give.",
        },
        {
          icon: "handshake",
          title: "Meet up and trade",
          body: "In-app chat, plan where to meet, rate each other after. No shipping.",
        },
      ],
    },
    why: {
      title: "Why Cromio",
      items: [
        {
          icon: "map",
          title: "Real proximity",
          body: "No waiting on parcels, no shipping fees. You trade today.",
        },
        {
          icon: "shield",
          title: "Privacy first",
          body: "We never share your exact street. Just a fuzzy zone.",
        },
        {
          icon: "bell",
          title: "Instant alerts",
          body: "Push notifications when a new match appears in your radius.",
        },
        {
          icon: "trophy",
          title: "Built for the World Cup",
          body: "All 48 teams, 16 host venues and the 17 special stickers.",
        },
      ],
    },
    install: {
      title: "Install it like an app",
      sub: "Cromio runs as a native-feeling app on any phone — and it's the only way to receive push notifications.",
      tabs: { ios: "iPhone / iPad", android: "Android", desktop: "Desktop" },
      ios: [
        "Open cromio.app in Safari (not another browser).",
        "Tap the Share button (square with up arrow).",
        "Choose “Add to Home Screen”.",
        "Confirm with “Add”. Open Cromio from the new icon.",
      ],
      iosNote: "iOS 16.4 or newer is required for push notifications.",
      android: [
        "Open cromio.app in Chrome.",
        "Tap the ⋮ menu at the top right.",
        "Choose “Install app” (or “Add to home screen”).",
        "Confirm with “Install” and allow notifications when prompted.",
      ],
      androidNote: "Remember to allow notifications when Chrome asks.",
      desktop: [
        "Open cromio.app in Chrome, Edge or Brave.",
        "Look for the install icon at the right of the address bar.",
        "Click “Install” and confirm.",
      ],
      desktopNote: "Also works as a normal website without installing anything.",
    },
    cta: {
      title: "Start completing your album",
      sub: "Create a free account. You only need a zone and an alias.",
      cta1: "Sign up",
      cta2: "I already have an account",
    },
    footer: {
      tagline: "Collector community · 2026 World Cup",
      about: "About",
      terms: "Terms",
      privacy: "Privacy",
      email: "hola@cromio.app",
      disclaimer:
        "Cromio is an independent app, not affiliated with FIFA or the publisher of the official album. Names and designs belong to their respective owners.",
    },
  },
} as const;

const WHY_ICON = { map: MapPin, shield: Shield, bell: Bell, trophy: Trophy } as const;
const HOW_ICON = { layers: Layers, radar: Radar, handshake: Handshake } as const;

export function LandingPage({ locale }: { locale: string }) {
  const t = COPY[(locale === "en" ? "en" : "es") as Locale];
  const prefix = locale === "es" ? "" : `/${locale}`;
  const loginHref = `${prefix}/login`;
  const signupHref = `${prefix}/signup`;

  return (
    <main className="min-h-dvh bg-bone text-text">
      {/* Top bar */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href={prefix || "/"} className="inline-flex items-center gap-2">
          <span
            className="grid h-10 w-10 place-items-center rounded-[10px] bg-green-500 text-white shadow-sh1"
          >
            <Radar size={22} strokeWidth={2.4} aria-hidden />
          </span>
          <span className="font-display text-2xl tracking-tight">CROMIO</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href={loginHref}
            className="hidden text-sm font-bold text-text-2 hover:text-text sm:inline"
          >
            {t.nav.login}
          </Link>
          <Link
            href={signupHref}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink px-3.5 text-xs font-bold text-white"
          >
            {t.nav.signup}
            <ArrowRight size={13} strokeWidth={2.4} />
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-5xl px-5 pt-6 pb-12 text-center sm:px-8 sm:pt-12 sm:pb-20">
        <div className="mx-auto inline-flex items-center justify-center">
          <span
            className="grid h-32 w-32 place-items-center rounded-3xl bg-green-500 text-white shadow-sh2"
          >
            <Radar size={72} strokeWidth={2.2} aria-hidden />
          </span>
        </div>
        <h1 className="mx-auto mt-4 max-w-3xl font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">
          {t.hero.h1}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-text-2 sm:text-lg">
          {t.hero.sub}
        </p>
        <div className="mx-auto mt-7 flex max-w-md flex-col items-stretch justify-center gap-3 sm:flex-row">
          <Link href={signupHref} className="flex-1">
            <Btn kind="primaryVibrant" size="lg" full icon={<ArrowRight size={16} />}>
              {t.hero.cta1}
            </Btn>
          </Link>
          <Link href={loginHref} className="flex-1">
            <Btn kind="ghost" size="lg" full>
              {t.hero.cta2}
            </Btn>
          </Link>
        </div>
        <p className="mt-4 text-[11px] uppercase tracking-wider text-text-2">
          {t.hero.meta}
        </p>
      </section>

      {/* What is */}
      <section className="mx-auto w-full max-w-5xl px-5 pb-12 sm:px-8 sm:pb-20">
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sh1 sm:p-10">
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
            {t.what.title}
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-2 sm:text-lg">
            {t.what.body}
          </p>
          <div className="mt-7 grid grid-cols-3 gap-3 sm:gap-6">
            {t.what.kpis.map((k) => (
              <div
                key={k.label}
                className="rounded-xl border border-line bg-paper p-3 text-center sm:p-5"
              >
                <p className="font-display text-3xl text-green-700 sm:text-5xl">
                  {k.value}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-text-2 sm:text-xs">
                  {k.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-5xl px-5 pb-12 sm:px-8 sm:pb-20">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
          {t.how.title}
        </h2>
        <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-3">
          {t.how.steps.map((s, i) => {
            const Icon = HOW_ICON[s.icon as keyof typeof HOW_ICON];
            return (
              <div
                key={s.title}
                className="relative rounded-2xl border border-line bg-white p-6 shadow-sh1"
              >
                <span className="absolute right-5 top-5 font-display text-4xl text-line-strong">
                  0{i + 1}
                </span>
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-green-50 text-green-700">
                  <Icon size={22} strokeWidth={2} />
                </div>
                <h3 className="mt-4 font-display text-xl">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-snug text-text-2">{s.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why Cromio */}
      <section className="mx-auto w-full max-w-5xl px-5 pb-12 sm:px-8 sm:pb-20">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
          {t.why.title}
        </h2>
        <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-5">
          {t.why.items.map((b) => {
            const Icon = WHY_ICON[b.icon as keyof typeof WHY_ICON];
            return (
              <div
                key={b.title}
                className="flex items-start gap-4 rounded-2xl border border-line bg-white p-5 shadow-sh1 sm:p-6"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-green-500 text-white">
                  <Icon size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="font-display text-lg">{b.title}</h3>
                  <p className="mt-1 text-sm leading-snug text-text-2">{b.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Install */}
      <section className="mx-auto w-full max-w-5xl px-5 pb-12 sm:px-8 sm:pb-20">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
          {t.install.title}
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-2 sm:text-lg">
          {t.install.sub}
        </p>
        <div className="mt-6 sm:mt-8">
          <InstallInstructions
            copy={{
              title: t.install.title,
              sub: t.install.sub,
              tabs: t.install.tabs,
              ios: [...t.install.ios],
              iosNote: t.install.iosNote,
              android: [...t.install.android],
              androidNote: t.install.androidNote,
              desktop: [...t.install.desktop],
              desktopNote: t.install.desktopNote,
            }}
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-5xl px-5 pb-16 sm:px-8 sm:pb-24">
        <div className="rounded-2xl bg-gradient-to-br from-green-700 to-green-900 px-6 py-10 text-center text-white shadow-sh2 sm:px-12 sm:py-14">
          <h2 className="font-display text-3xl tracking-tight sm:text-5xl">
            {t.cta.title}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/85 sm:text-base">
            {t.cta.sub}
          </p>
          <div className="mx-auto mt-6 flex max-w-md flex-col items-stretch justify-center gap-3 sm:flex-row">
            <Link
              href={signupHref}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-green-900 shadow-sh1"
            >
              {t.cta.cta1}
              <ArrowRight size={16} strokeWidth={2.4} />
            </Link>
            <Link
              href={loginHref}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-white/30 px-6 text-sm font-bold text-white hover:bg-white/10"
            >
              {t.cta.cta2}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line bg-paper">
        <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="grid h-9 w-9 place-items-center rounded-lg bg-green-500 text-white shadow-sh1"
              >
                <Radar size={20} strokeWidth={2.4} aria-hidden />
              </span>
              <div>
                <p className="font-display text-xl tracking-tight">CROMIO</p>
                <p className="text-[11px] uppercase tracking-wider text-text-2">
                  {t.footer.tagline}
                </p>
              </div>
            </div>
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-text-2">
              <Link href={`${prefix}/sobre`} className="hover:text-text">
                {t.footer.about}
              </Link>
              <Link href={`${prefix}/terminos`} className="hover:text-text">
                {t.footer.terms}
              </Link>
              <Link href={`${prefix}/privacidad`} className="hover:text-text">
                {t.footer.privacy}
              </Link>
              <a
                href={`mailto:${t.footer.email}`}
                className="inline-flex items-center gap-1.5 hover:text-text"
              >
                <Mail size={13} strokeWidth={2.2} />
                {t.footer.email}
              </a>
            </nav>
          </div>
          <p className="mt-6 max-w-3xl text-[11px] leading-relaxed text-text-2">
            {t.footer.disclaimer}
          </p>
        </div>
      </footer>
    </main>
  );
}
