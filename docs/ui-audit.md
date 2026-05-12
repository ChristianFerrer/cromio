# Cromio — Auditoría UX/UI · Fase 1

> Fecha: 2026-05-11 · Rama: `feat/ui-redesign` · Estado actual de prod en `claude/setup-cromio-pwa-design-Tnidb`.

Esta auditoría es **solo lectura**. Identifica hallazgos y los prioriza; no toca código. Acompaña a `brand-analysis.md` y precede a `design-system.md` (Fase 3).

## 1. Stack detectado

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) | `next.config.ts` mínimo. `experimental.viewTransition` recientemente desactivado por perf (ver §4 perf). |
| UI runtime | React 19 | Concurrencia activada, `useTransition` ya en uso. |
| Estilos | Tailwind CSS 3.4 + CSS custom en `app/globals.css` | Tokens (colores, radios, shadows, fonts) en `tailwind.config.ts`. **Tokens en JS, no en CSS vars** — limita interop con runtime-theming (dark mode manual, accent override por usuario). |
| Fonts | Bebas Neue + Inter + JetBrains Mono | `next/font/google` con `display: swap`. Variables CSS expuestas correctamente. |
| Iconos | lucide-react 0.460 | Bien — tree-shaken, peso aceptable. |
| Mapa | **Leaflet 1.9.4** | Tiles servidos por `/tiles/[z]/[x]/[y]/route.ts` (Edge proxy a OSM). `maplibre-gl 4.7` está en `package.json` **pero no se usa**: peso muerto en bundle de ~600 KB descomprimido. |
| Backend / auth | Supabase (`@supabase/ssr` + `@supabase/supabase-js`) | RLS activo. Realtime para chat + favoritos + trades. |
| Push | `web-push 3.6` server-side, VAPID, Service Worker propio | Solo nativo Notifications API; sin pre-prompt — pide permiso al primer intento. |
| i18n | next-intl 4 (`as-needed` prefix) | `es` por defecto, `en` también. |
| Estado cliente | Hooks propios (`useUser`, `useCollection`, `useFavorites`) con caché module-level reciente. Sin Zustand/Jotai. | OK; no introduce dependencias. |
| Service Worker | `public/sw.js` (vanilla, sin Workbox) | Tres estrategias: tiles cache-first, HTML network-first, resto SWR. Push + notificationclick. **No tiene size cap en el tile cache** (#A4). |
| Estilo de mapa | Tiles OSM "standard" (raster .png), sin restilizar | Atribución correcta (`bottomright`). No hay clustering, no hay Canvas renderer (§4 mapa). |

## 2. Audit del PWA

`public/manifest.webmanifest`:

| Campo | Valor | Veredicto |
|---|---|---|
| `name` / `short_name` | "Cromio" | ✅ |
| `description` | "*Encuentra coleccionistas del álbum **Panini** **Mundial 2026** cerca de ti.*" | ❌ **Bloqueante**. Viola la restricción "app independiente, sin marcas oficiales". Hay que reescribir a algo neutro: *"Encuentra coleccionistas a tu alrededor e intercambia cromos en persona."* |
| `start_url` | `/` | ⚠️ Va al landing público. Para usuarios ya logueados eso significa un `redirect()` extra cada vez que abren la app instalada. Mejor `/album`. |
| `display` | `standalone` | ✅ |
| `orientation` | `portrait` | ✅ |
| `background_color` | `#FAFAF7` (bone) | ✅ |
| `theme_color` | `#066B40` (green-900) | ✅ coherente con la marca; cubre la barra del sistema en Android. |
| `icons` | 1 sola `cromio_icon.png` (512×512) usada como `any` Y como `maskable` | ❌ **Crítico**. El PNG no tiene safe-zone maskable: el squircle ocupa todo el frame, así que en Android el sistema lo recorta. Falta también el icono de 192×192 que la spec recomienda. Hay un `icon-maskable.svg`, pero no está enchufado al manifest. |
| `shortcuts` | Radar / Álbum / Chat | ✅ Tres atajos útiles. Pero usan `icon.svg` (el SVG fallback feo) en lugar del icono real → en Android Pixel-Launcher se ven como anillos de colores. |
| `screenshots` | ❌ no hay | Falta para la install promo card en Android/Chrome. |
| **Splash screen iOS** | `appleWebApp.startupImage: ["/icon.svg"]` en `app/layout.tsx` | ❌ El SVG fallback no es un splash. Hay que generar PNGs con bg `#FAFAF7` + logo centrado para cada tamaño iOS. |
| `prefer_related_applications` | `false` | ✅ |

`public/sw.js`:

- ✅ Versionado (`v10`), `skipWaiting` + `clients.claim`.
- ✅ Tres estrategias bien separadas: tiles cache-first, HTML network-first con fallback `/offline.html`, resto SWR.
- ✅ Push handler con tag/renotify.
- ⚠️ El cache de tiles `cromio-tiles-v1` **no tiene cap de tamaño ni expiración**. Un usuario que pase un mes haciendo pan/zoom puede acumular cientos de MB.
- ⚠️ No hay **cola de acciones offline** (ej. mandar mensaje sin conexión queda perdido).
- ⚠️ `notificationclick` hace `client.navigate(url)` — si el cliente no existe, abre nueva ventana. OK, pero no hay test para detectar URLs maliciosas en payload (mitigado por la VAPID pero auditable).

## 3. Inventario de pantallas y flujos

### Authed (auth wall ya aplicado en `app/[locale]/(app)/layout.tsx`)

| Ruta | Estado | Notas para redesign |
|---|---|---|
| `/album` | Cliente | Tabs Selecciones/Especiales/Estadios + filtro por país + grid responsivo. Cromos con CromoCard (4 tamaños). El componente es complejo y muy iterado. |
| `/mapa` | Cliente | El producto principal. Radar custom + pines, slider de radio (200m–10km libre, 5/10/50km Pro), vista lista alternativa. Pulse, sweep, ring de radio difuso. |
| `/match/[userId]` | Cliente | Detalle: header compacto, progreso del otro, dos columnas Recibes/Entregas, CTA chat + botón Intercambiar (icono cuadrado con dot rojo). Estado de trade activo en realtime. |
| `/favoritos` (BottomNav dice "Contactos") | Cliente | Lista de favoritos con `MatchArrows`, distancia, % completado, barra de progreso. Buscador inline de coleccionistas. |
| `/chat` | Server + cliente | Lista de chats. Tras el refactor trades es sólo lista plana de conversaciones. Skeleton-ready. |
| `/chat/[chatId]` | Cliente | Mensajes con day separators, chips `#N` clickables (abren CromoPreviewSheet), input + send. Realtime + polling fallback. **No tiene el botón de Intercambiar arriba**: el flujo trade vive en `/match`. |
| `/perfil` | Server | Header del propio user + tiles a sub-páginas (intercambios, lista de deseos, bloqueos, sobre, terminos, privacidad). Settings de push/sonido inline. |
| `/perfil/editar` | Cliente | Alias / display_name / bio. |
| `/perfil/intercambios` | Server | Lista de trades cerrados (`status='done'`). |
| `/perfil/lista-deseos` | Server | Wishlist de cromos. |
| `/perfil/bloqueos` | Server | Lista de usuarios bloqueados. |
| `/admin/{dashboard,usuarios,auditoria}` | Server | Solo `is_admin`. Diseño minimal pre-fabricado. |
| `/banned` | Server | Pantalla de baneo cuando `profiles.banned_at` está set. |
| `/sobre`, `/terminos`, `/privacidad` | Server | Legal shells con texto. |

### Públicas (route group `(auth)` y root)

| Ruta | Notas |
|---|---|
| `/` (landing) | Hero + qué es + cómo funciona + por qué + cómo instalar PWA + footer. Bilingüe es/en inline. |
| `/login` | Email/pwd + Google OAuth. |
| `/login/recuperar` | Reset password. |
| `/signup` | Email/pwd. |
| `/onboarding` | 2 pasos: Ubicación + Identidad. Reciente refactor. |

### Lo que falta (no existe, hace falta para PWA seria)

| Pantalla | Por qué |
|---|---|
| **Install prompt UI** | No hay onboarding del `beforeinstallprompt`. El landing **explica cómo instalar** pero la app no captura el evento ni muestra un trigger CTA. |
| **Pre-prompt de geolocalización** | Cuando se pide la ubicación, el navegador lanza el prompt nativo de golpe en `requestLocation()` del onboarding. Si el usuario lo deniega, no hay flow de recuperación que explique *por qué* sirve. |
| **Pre-prompt de push** | Igual con `Notification.requestPermission()` desde `lib/push/actions.ts`. |
| **Estado sin conexión global** | Hay `offline.html` para HTML pero **no hay banner persistente** dentro de la app cuando se pierde la conexión durante el uso. El usuario sigue tocando sin feedback. |
| **Centro de actividad / inbox unificado** | Push notifications sí, pero no hay "campana" en la app que liste avisos pasados (matches nuevos, trades, mensajes). |
| **Cuenta cerrada por seguridad / banned con apelación** | `/banned` existe, pero no hay flujo de "apelar". |

## 4. Hallazgos priorizados

> Convención: **A** = Alta (bloqueante o impacta cada uso), **M** = Media (fricción real), **B** = Baja (polish).

### Marca y compliance

| # | Severidad | Hallazgo | Refs |
|---|---|---|---|
| B1 | **A** | El `manifest.description` y las metadatas en `app/layout.tsx` mencionan "Panini" y "Mundial 2026" como producto oficial. Hay que neutralizar todas las referencias marcarias a Panini/FIFA. | `public/manifest.webmanifest:4`, `app/layout.tsx:24` |
| B2 | **A** | El `icon.svg` (fallback programático con anillos+C) no encaja con el logo real. Se usa en `shortcuts` y `appleWebApp.startupImage`, así que aparece en la home de Android y como splash de iOS. Hay que reconstruir el glifo del PNG en SVG limpio. | `public/icon.svg`, `manifest:shortcuts`, `app/layout.tsx:42` |
| B3 | **A** | No hay icon `maskable` real: el PNG llena todo el frame sin safe-zone, así que Android lo recorta. | `public/cromio_icon.png` declarado como `maskable` en manifest |
| B4 | **M** | El logo solo existe en una versión (verde sobre transparente). Falta inversa (blanco sobre verde) para superficies de la app. | — |
| B5 | **B** | Falta `screenshots` en el manifest, así que la install promo card en Android es pobre. | manifest |

### Mapa (OSM + Leaflet)

| # | Severidad | Hallazgo | Refs |
|---|---|---|---|
| M1 | **A** | Tiles OSM "standard" (multicolor saturado) **compiten visualmente con los pines**. A pleno sol, los pines de marca verde se mezclan con el verde de parques/zonas y los avisos rojos con techos de tejas. Es el principal problema de UX al usar la app en la calle. | `components/map/LeafletMap.tsx:51` |
| M2 | **A** | **Sin clustering** de pines. Con 100+ usuarios cerca, Leaflet se ralentiza y el mapa se vuelve ilegible. Hoy no es problema por baja densidad, pero la PR de crecimiento lo será. | `LeafletMap.tsx:` markers añadidos sueltos |
| M3 | **M** | **Sin Canvas renderer** (Leaflet por defecto usa SVG). Con >100 marcadores el frame rate cae en móvil. | `LeafletMap.tsx:` `L.map` options |
| M4 | **M** | El círculo de "radio de visibilidad" no es un `L.circle` proper: es un canvas dibujado encima. Esto rompe pan/zoom (no escala correctamente con el zoom) y dificulta accesibilidad (no es focuseable, no tiene aria-label). | `LeafletMap.tsx:` ring de radio |
| M5 | **M** | `maplibre-gl` está como dependencia pero **no se usa**. Bundle peso muerto. | `package.json:22` |
| M6 | **M** | El cache de tiles del SW no tiene cap → en dispositivos con storage tight, el navegador puede evict cache aleatoriamente o el sistema mostrar alertas. | `public/sw.js:5` |
| M7 | **B** | Atribución OSM está, pero en el bottom-right, escondida bajo la card de "radio de búsqueda" que está en `bottom-24`. Hay que asegurar que se sigue viendo al hacer scroll/zoom. | `LeafletMap.tsx:60` |

### PWA / outdoor / one-hand

| # | Severidad | Hallazgo | Refs |
|---|---|---|---|
| P1 | **A** | **Sin pre-prompts**: la app pide geolocalización y notificaciones con el prompt nativo a quemarropa. Tasa de denegación esperada > 40 %. Si el usuario deniega, no hay recovery UI visible. | `app/[locale]/(auth)/onboarding/page.tsx:` `navigator.geolocation.getCurrentPosition`, `lib/push/actions.ts:` |
| P2 | **A** | **Contraste a pleno sol**: el `text-text-2` (#5C5A50) sobre `bone` (#FAFAF7) pasa AA solo justo (4.7:1). En el mapa, los pines blancos con texto gris claro son ilegibles al sol. Falta un "outdoor mode" o subir el contraste base. | `tailwind.config.ts:` palette, `LeafletMap.tsx:` pines |
| P3 | **A** | **Dark mode no existe** salvo lo que el OS hereda. No hay `prefers-color-scheme` ni override manual. La app es 100% light. | `app/globals.css`, `tailwind.config.ts:` no `darkMode` |
| P4 | **M** | **Touch targets**: muchos botones secundarios miden 36–40 px (h-9, h-10). HIG iOS pide 44. La barra de filtros del radar `h-7` es 28 px → demasiado pequeño para pulgar al sol. | `app/[locale]/(app)/mapa/page.tsx:` `h-7` chips, `IconBtn` size sm |
| P5 | **M** | **One-handed reach**: las acciones primarias del match (`/match/[userId]`) están en bottom CTA ✅. Pero las acciones secundarias (atrás, favorito, menú ⋮) están en `pt-14` arriba, fuera del thumb zone. Aceptable, pero en pantallas grandes (Pixel 8 Pro, iPhone 16 Plus) duele. | `match/page.tsx:316` |
| P6 | **M** | **Sin estado offline visible** mientras se usa la app. Solo aparece `/offline.html` al recargar sin red. Falta toast/banner persistente. | — |
| P7 | **M** | **No hay queue de acciones offline**. Mandar mensaje sin red devuelve error en vez de encolar. | `lib/chat/actions.ts:sendMessage` |
| P8 | **B** | Notificaciones push no tienen "centro" — solo aparecen, se cierran y se pierden. Falta lista en `/perfil` o campana en el header. | — |
| P9 | **B** | `notificationclick` abre la URL del payload sin sanitize. Aceptable (controlamos los emisores) pero auditable. | `public/sw.js:132` |

### Performance percibida y bundle

| # | Severidad | Hallazgo | Refs |
|---|---|---|---|
| F1 | **M** | `maplibre-gl` en bundle sin usarse: ~600 KB descomprimido. | `package.json` |
| F2 | **M** | Imágenes del logo cargan en cada page (`<Image src="/cromio_bg.png">` … espera, no existe ese path; es `cromio_icon.png`). Hay 3 lugares (`landing/page.tsx`, `Logo.tsx`, `Notif`). Cada uno carga el PNG aunque ya esté cacheado. Falta `priority` en LCP y consolidar a un solo Image. | `app/[locale]/page.tsx`, `components/Logo.tsx` |
| F3 | **M** | `lucide-react` se importa con destructuring por nombre — bien. Pero el landing importa 9 iconos. Verificar que el tree-shaking quite los demás. (Probable que ya esté OK con Next 16.) | landing imports |
| F4 | **B** | Faltan `loading.tsx` en `/match/[userId]` y `/chat/[chatId]`. Estos son pesados (RLS queries + realtime setup). | `app/[locale]/(app)/match/`, `chat/[chatId]/` |
| F5 | **B** | El SW guarda HTML cacheado **sin TTL** → si la versión cambia, el usuario sigue viendo HTML viejo hasta que el SW se activa. Mitigado por `version` bumping, pero la activación es asíncrona. | `public/sw.js:RUNTIME_CACHE` |

### Accesibilidad

| # | Severidad | Hallazgo | Refs |
|---|---|---|---|
| A1 | **A** | **`prefers-reduced-motion`** parcialmente respetado: globals.css solo afecta `.cromio-pin`, no las animaciones del radar (pulse, sweep) ni los `transition-colors` de los botones. | `app/globals.css:270` |
| A2 | **M** | **Color como única señal**: el match arrow rojo/verde no tiene texto alternativo; un daltónico no distingue ▼ verde de ▲ rojo. Hace falta iconos diferentes o etiquetas adicionales. | `components/match/MatchArrows.tsx` |
| A3 | **M** | El mapa no es navegable por teclado (Leaflet lo es por defecto pero los pines custom con divIcon **no lo son**). Cero focus en pines. | `LeafletMap.tsx:` divIcon markers |
| A4 | **M** | El radar canvas (pulse/sweep) no tiene `aria-hidden` ni descripción. Lectores de pantalla lo anuncian como "image". | `LeafletMap.tsx` |
| A5 | **B** | Los `IconBtn` ya tienen `aria-label` y la app tiene focus-visible ring global ✅. |  |

### Estados vacíos y feedback

| # | Severidad | Hallazgo | Refs |
|---|---|---|---|
| E1 | **M** | **Album sin cromos** sólo muestra el grid en blanco con `0/980`. Falta CTA grande tipo "Marca tus primeros cromos" con flecha al primer hueco. | `album/page.tsx` |
| E2 | **M** | **Radar sin nadie cerca** muestra el banner *"Sin coleccionistas en X km"* (bien) pero solo se ve si el banner no está dismiss-ado. Cuando lo cierras, queda un radar vacío sin texto explicativo. | `mapa/page.tsx:127` |
| E3 | **M** | **Chat vacío** explica bien (con CTA al mapa) ✅. |  |
| E4 | **B** | **Match vacío** (no hay cromos para intercambiar) deja el botón Intercambiar disabled pero no explica. Falta tooltip o texto debajo. | `match/page.tsx` |
| E5 | **B** | Los toasts de error a veces son crípticos (`stale`, `already_pending`). Hay un mapping en `TradeRequestSheet` pero no es exhaustivo. | `components/trade/TradeRequestSheet.tsx` |

### Privacidad visual

| # | Severidad | Hallazgo | Refs |
|---|---|---|---|
| V1 | **A** | **El radar de privacidad solo se aplica visualmente**: el mapa muestra un pin para cada user, en una posición que `lng,lat` calcula desde `bearing_deg` + `distance_m` (relativos a tu centro). Es correcto: el otro usuario no se geolocaliza con precisión. Confirmado en `lngLatFromBearing` (`hooks/useNearbyUsers.ts:154`). **OK como diseño.** Pero la UI no comunica esto → el usuario percibe que se puede ver "dónde vive" otro. Falta texto explícito de privacidad. | `useNearbyUsers.ts:154`, `mapa/page.tsx` |
| V2 | **M** | **Modo invisible** no existe. Un usuario no puede pausar su visibilidad en el mapa sin desactivar la ubicación a nivel OS. Es una feature que muchos pedirán. | — |
| V3 | **M** | El propio user se ve a sí mismo en el centro con un dot verde pulsante. La posición es la real (no difusa). Si comparte la pantalla, **revela su calle**. Aceptable (es su sesión) pero conviene tener un toggle "ocultar mi pin durante captura". | `LeafletMap.tsx` user dot |

### Cromos

| # | Severidad | Hallazgo | Refs |
|---|---|---|---|
| C1 | **M** | El `CromoCard` ha sufrido muchas iteraciones de layout (centro/esquinas/bordes rojos para repe). Funciona pero está sobre-rebuscado. Worth un refactor a un sistema más sistemático: anatomía con slots claros (badge, code, flag, type, state). | `components/cromo/CromoCard.tsx` |
| C2 | **M** | No hay **flip front/back** de cromo. Los cromos físicos tienen reverso (nombre + nº + bio); aquí solo se ve "frente" sintético. Es una micro-interaction signature que sumaría mucho a la identidad "coleccionista". | — |
| C3 | **B** | No hay tratamiento de **rareza visual** más allá de un pill text. Los "legendarios" (jugador #20 de cada selección) podrían tener foil holográfico CSS (gradient conic en movimiento). | `CromoCard:` rarity classes |
| C4 | **B** | Las banderas son SVGs custom escritos a mano por país. Calidad mixta (algunas con detalles caseros). Aceptable pero algunas pueden mejorar. | `components/cromo/Flag.tsx` |

### Onboarding y prompts

| # | Severidad | Hallazgo | Refs |
|---|---|---|---|
| O1 | **A** | Onboarding actual son 2 pasos. **Falta un paso 0 de "bienvenida + qué vas a permitir"** que prepare al usuario para los prompts del navegador. Esto solo se resuelve en Fase 4. | `onboarding/page.tsx` |
| O2 | **M** | No hay **fallback de ubicación gracioso** si el usuario rechaza el prompt. Hoy: lista hardcoded de 8 ciudades. OK como MVP pero falta una opción "Detéctame por IP aproximada" (Cloudflare, Vercel headers). | `onboarding:LocationStep` |

## 5. Quick wins vs estratégico

### Quick wins (Fase 4 early, < 1 día c/u)

- B1: limpiar "Panini" / "Mundial 2026" en manifest, layout y landing.
- B3: regenerar `cromio_icon-512.png` y `cromio_icon-192.png` con safe-zone maskable real (proceso: scale al 80% y pad).
- B5: añadir 2 screenshots al manifest (`/album`, `/mapa`).
- M5/F1: drop `maplibre-gl` del package.json si confirmamos que se queda en Leaflet (decisión de Fase 3).
- F4: añadir `loading.tsx` en `/match/[userId]` y `/chat/[chatId]`.
- A2: cambiar arrow iconos para que no dependan solo de color.
- P4: subir tamaño de chips del radar de `h-7` a `h-10`.

### Estratégico (Fase 3 + 4)

- M1 (Mapa OSM ilegible): proponer una de las tres aproximaciones del prompt — **mi recomendación preliminar es (a) tiles alternativos** (CartoDB Positron en day, Dark Matter en night) por ser bajo coste y respetar OSM. Filtros CSS son demasiado frágiles cross-browser. MapLibre solo si se quiere dark mode propio con interpolación de zoom.
- M2/M3: clustering + Canvas renderer cuando se decida el direccionamiento.
- P1: pre-prompts ilustrados.
- P3: dark mode completo con `prefers-color-scheme` + override en `/perfil`.
- V1/V2: panel de privacidad explícito + modo invisible.
- C1/C2/C3: refactor del CromoCard como sistema (anatomía + state machine + variantes de rareza) y micro-interacción flip.

## 6. Lo que NO está roto (preservar)

Conviene anotar para no romper accidentalmente en Fase 4:

- ✅ El sistema de tiles OSM via Edge proxy (`/tiles/[z]/[x]/[y]/route.ts`) es bueno: ahorra peticiones a OSM directo, no expone IP del cliente al servidor de tiles, cachea Edge-side.
- ✅ El Service Worker es sólido: el versionado y las tres estrategias separadas funcionan; solo le falta cap y queue.
- ✅ La caché de hooks recién metida (`useUser`, `useCollection`, `useFavorites`) es la base correcta de la navegación instantánea. No tocar.
- ✅ El refactor de trade requests (PR reciente) ya simplificó el chat. No revertir.
- ✅ El sistema de focus-visible global. Mantener; integrar al nuevo token de "accent ring".
- ✅ La arquitectura de auth wall en `(app)/layout.tsx`. Sólida.
- ✅ El `next-intl` config con `as-needed` prefix. Funciona.

## 7. Preguntas abiertas para Fase 2

1. **Dark mode**: ¿auto por OS, manual override en perfil, o ambas? Mi recomendación: auto + override.
2. **Identidad**: ¿el redesign mantiene Bebas + Inter o explora variable fonts modernas (Geist, Public Sans variable)? Bebas es muy "deportivo" pero limitado en pesos.
3. **Decisión del mapa OSM**: ya hay 3 alternativas planteadas (a/b/c). Voy a recomendar una en Fase 2; ¿quieres ver mockups de las 3 o solo de la elegida?
4. **MapLibre fuera**: ¿confirmamos que NO migramos a MapLibre y droppeamos esa dep, o sigue como opción a futuro?
5. **"Mundial 2026" textualmente sí, marcariamente no**: ¿podemos seguir mencionando "Mundial 2026" como contexto temporal (ej. "Cromio para el Mundial 2026") sin usar "Panini" ni escudos? Asumo que sí.
6. **Soporte de instalación**: ¿queremos capturar `beforeinstallprompt` y mostrar un trigger UI propio en `/perfil` o en una notificación toast, además de las instrucciones en landing?

---

**Próximo paso**: producir Fase 2 — 3 direcciones visuales basadas en el logo + decisión recomendada para el mapa. Espera tu OK + las respuestas a las 6 preguntas de arriba (o "decide tú" para cualquiera de ellas).
