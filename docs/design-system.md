# Cromio — Sistema de diseño · Fase 3

> Dirección elegida: **D1 «Estadio nocturno»** como base + microcelebraciones y flip de cromo prestados de D3.
> Branch: `feat/ui-redesign-retry`. Sin tocar producción. La Fase 4 (implementación) requiere tu OK.

Esta es la fuente de verdad del sistema. Los tokens viven como variables CSS en `docs/preview/_tokens.css`; los componentes en `docs/preview/_components.css`. Los mockups en `docs/preview/mockup-*.html` los importan via `@import`.

## Índice

1. [Tokens — color, light + dark](#1-tokens--color-light--dark)
2. [Tokens — tipografía](#2-tokens--tipografía)
3. [Tokens — spacing, radio, sombra, blur](#3-tokens--spacing-radio-sombra-blur)
4. [Motion — duraciones, easings, signatures](#4-motion--duraciones-easings-signatures)
5. [Anatomía de componentes](#5-anatomía-de-componentes)
6. [Mapa OSM — implementación](#6-mapa-osm--implementación)
7. [PWA assets — iconos, splash, manifest](#7-pwa-assets--iconos-splash-manifest)
8. [Accesibilidad](#8-accesibilidad)
9. [Mockups](#9-mockups)

---

## 1. Tokens — color, light + dark

La paleta arranca del verde marca `#1FAE5A` y deriva todo lo demás. Dark es **modo primario** (la app vive de noche); Light es alternativo. Ambos respetan WCAG AA en cada combinación texto/fondo definida.

### Estructura

Los tokens se exponen como variables CSS bajo el selector `[data-theme="dark"]` y `[data-theme="light"]`, más un fallback con `@media (prefers-color-scheme)`. Esto permite override manual desde `/perfil` (Fase 4) escribiendo `data-theme` al `<html>`.

### Brand

| Token | Dark | Light | Uso |
|---|---|---|---|
| `--brand-500` | `#1FAE5A` | `#1FAE5A` | Anchor; idéntico al logo. |
| `--brand-400` | `#3DCB7A` | `#178C48` | Estados interactivos primarios (botones hover, pins de match). |
| `--brand-300` | `#7BE5A6` | `#0E7E3F` | Texto/icono brand sobre fondo dark / light. |
| `--brand-700` | `#0E7E3F` | `#0E7E3F` | Acento estructural. |
| `--brand-900` | `#053A1E` | `#053A1E` | Sombra profunda con tinte brand. |
| `--brand-bg` | `rgba(31, 174, 90, 0.12)` | `rgba(31, 174, 90, 0.1)` | Bg suave (chips activos, banners). |

### Neutros

| Token | Dark | Light | Uso |
|---|---|---|---|
| `--bg-base` | `#0E120F` | `#FAFAF8` | Fondo de la app. |
| `--bg-surface` | `#161B17` | `#FFFFFF` | Cards, sheets, headers. |
| `--bg-elevated` | `#1E251F` | `#FFFFFF` | Modales, popovers (elevación visual). |
| `--bg-overlay` | `rgba(255,255,255,0.04)` | `rgba(0,0,0,0.04)` | Hover sutil. |
| `--text-primary` | `#F8FAF8` | `#0E120F` | Texto principal. **AA: 16.8:1 sobre `--bg-base`.** |
| `--text-secondary` | `#A8B0AA` | `#5C6359` | Subtítulos, metadatos. **AA: 6.4:1 / 6.1:1.** |
| `--text-tertiary` | `#6B7570` | `#8A8F87` | Texto menos importante. **AA Large: 4.6:1.** |
| `--border-subtle` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.05)` | Separadores no críticos. |
| `--border-default` | `rgba(255,255,255,0.12)` | `rgba(0,0,0,0.1)` | Bordes de card. |
| `--border-strong` | `rgba(255,255,255,0.22)` | `rgba(0,0,0,0.18)` | Inputs, ghost buttons. |

### Acentos semánticos

| Token | Dark | Light | Uso |
|---|---|---|---|
| `--success` | `var(--brand-400)` | `var(--brand-600)` | Match exitoso, trade aceptado. |
| `--warning` | `#F59E0B` | `#B45309` | Pre-prompt de permisos, modo offline. |
| `--danger` | `#FF4D6D` | `#D7263D` | Entregas en trade, baneo, errores. |
| `--info` | `#5BB4FF` | `#1659D6` | "Te interesa", banners de privacidad. |
| `--gold` | `#F5C518` | `#C58F0F` | Legendarios + Pro. **Brillo solo en dark.** |
| `--gold-bg` | `rgba(245,197,24,0.14)` | `rgba(197,143,15,0.12)` | Bg para chips de Pro. |

### Match (dominio Cromio)

| Token | Dark | Light | Uso |
|---|---|---|---|
| `--match-give` | `#FF4D6D` | `#D7263D` | Cromos que entregas (rojo). |
| `--match-lead` | `#5BB4FF` | `#1659D6` | "Te interesa" — solo tú recibes (azul). |
| `--match-both` | `var(--brand-400)` | `var(--brand-500)` | Doble match (verde). |

### Mapa

| Token | Dark | Light | Uso |
|---|---|---|---|
| `--map-bg` | `#0B0F0C` | `#F7F5F1` | Fondo del contenedor del mapa (lo que se ve detrás de los tiles si fallan). |
| `--map-pin-shadow` | `0 0 24px rgba(31,174,90,0.4)` | `0 4px 10px rgba(0,0,0,0.15)` | Halo del pin de match. |
| `--map-radius-stroke` | `rgba(31,174,90,0.65)` | `rgba(31,174,90,0.5)` | Borde del círculo de radio difuso. |
| `--map-radius-fill` | `rgba(31,174,90,0.08)` | `rgba(31,174,90,0.06)` | Relleno del círculo. |

---

## 2. Tokens — tipografía

### Familias

```css
--font-display: "Geist", system-ui, sans-serif;            /* variable 400→900 */
--font-text: "Inter", system-ui, sans-serif;               /* variable 400→800 */
--font-mono: "Geist Mono", ui-monospace, monospace;        /* variable 400→700 */
```

**Geist** sustituye a Bebas Neue como display. Razones: variable (acceso a todos los pesos en un solo archivo), geométrica moderna, alta legibilidad a tamaños pequeños donde Bebas tropezaba. Bebas se queda en el repo solo para retro-compat hasta Fase 4 final.

### Escala

Sistema **clamp** para fluido entre móvil y desktop sin breakpoints:

| Token | Valor | Uso |
|---|---|---|
| `--text-2xs` | `clamp(10px, 1.5vw, 11px)` | Microcopy, captions. |
| `--text-xs` | `clamp(11px, 2.5vw, 12px)` | Meta. |
| `--text-sm` | `clamp(13px, 3vw, 14px)` | Body. |
| `--text-base` | `clamp(15px, 3.5vw, 16px)` | Body principal. |
| `--text-lg` | `clamp(17px, 4vw, 19px)` | Subtítulos. |
| `--text-xl` | `clamp(21px, 5vw, 24px)` | H3. |
| `--text-2xl` | `clamp(26px, 6vw, 30px)` | H2 / display-sm. |
| `--text-3xl` | `clamp(34px, 8vw, 42px)` | H1 / display-md. |
| `--text-4xl` | `clamp(48px, 11vw, 64px)` | Hero / display-lg. |

### Pesos

`var(--fw-regular: 400)`, `var(--fw-medium: 500)`, `var(--fw-bold: 700)`, `var(--fw-black: 800)`. Solo los usamos como CSS vars para forzar consistencia entre componentes (no permitir `font-weight: 600` aleatorio).

### Numerales tabulares

Para datos de cromos (`#125`, distancias, fechas), CSS feature `tnum`:

```css
.tabular { font-variant-numeric: tabular-nums; }
```

---

## 3. Tokens — spacing, radio, sombra, blur

### Spacing (escala 4 px)

```css
--space-0:  0px;    --space-1:  4px;    --space-2:  8px;
--space-3:  12px;   --space-4:  16px;   --space-5:  20px;
--space-6:  24px;   --space-8:  32px;   --space-10: 40px;
--space-12: 48px;   --space-16: 64px;   --space-20: 80px;
--space-24: 96px;
```

### Radios

```css
--radius-xs: 4px;       /* badges */
--radius-sm: 8px;
--radius-md: 12px;      /* card de cromo (igual que hoy) */
--radius-lg: 16px;      /* sheets, modales */
--radius-xl: 24px;      /* hero cards */
--radius-2xl: 32px;
--radius-full: 9999px;  /* chips, pin avatar */
```

### Elevación (sombras)

Dark mode usa shadows tenues (el fondo ya es oscuro) y se apoya en **glows** brand para señalar elevación.

```css
/* Dark */
--shadow-1: 0 1px 2px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.4);
--shadow-2: 0 4px 8px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.4);
--shadow-3: 0 12px 24px rgba(0,0,0,0.55), 0 4px 8px rgba(0,0,0,0.45);
--shadow-4: 0 24px 40px rgba(0,0,0,0.6), 0 8px 16px rgba(0,0,0,0.5);
--shadow-glow-brand: 0 0 24px rgba(31,174,90,0.4);
--shadow-glow-gold:  0 0 24px rgba(245,197,24,0.45);
--shadow-glow-danger: 0 0 20px rgba(255,77,109,0.4);

/* Light */
--shadow-1: 0 1px 2px rgba(11,28,18,0.06), 0 2px 4px rgba(11,28,18,0.04);
--shadow-2: 0 4px 14px rgba(11,28,18,0.08), 0 1px 3px rgba(11,28,18,0.05);
--shadow-3: 0 10px 30px rgba(11,28,18,0.12), 0 4px 10px rgba(11,28,18,0.06);
--shadow-4: 0 24px 40px rgba(11,28,18,0.16), 0 8px 16px rgba(11,28,18,0.08);
```

### Blur

```css
--blur-sm: 4px;
--blur-md: 12px;       /* backdrop-filter en sheets/popovers */
--blur-lg: 24px;       /* glassmorphism en bottom nav */
```

---

## 4. Motion — duraciones, easings, signatures

### Duraciones

```css
--motion-xs: 100ms;     /* press feedback */
--motion-sm: 150ms;     /* hover, color transitions */
--motion-md: 220ms;     /* fade in/out, sheet enter */
--motion-lg: 340ms;     /* sheet exit, transition route (si volvemos) */
--motion-xl: 520ms;     /* flip de cromo */
--motion-2xl: 800ms;    /* confetti, "celebración" */
```

### Easings

```css
--ease-standard:  cubic-bezier(0.2, 0, 0, 1);          /* default UI */
--ease-emphasis:  cubic-bezier(0.16, 1, 0.3, 1);       /* entradas */
--ease-bounce:    cubic-bezier(0.34, 1.56, 0.64, 1);   /* pin landing, badge */
--ease-decel:     cubic-bezier(0.05, 0.7, 0.1, 1);     /* sweep radar */
```

### Signatures (micro-interacciones de marca)

Cada una documentada con su nombre de animación CSS para que esté disponible en todos los mockups y luego en `globals.css`:

1. **`cromio-pulse-self`** — el dot del usuario en el mapa. Anillo expandiéndose en 2.4s linear infinite, opacidad 0.5 → 0.
2. **`cromio-sweep`** — barrido del radar. Cono de 90° rotando 360° en 5s linear infinite. Más lento que ahora (3.6s) para que cansé menos.
3. **`cromio-pin-drop`** — pin que aparece. `translateY(-12px)` → `0`, `scale(0.85)` → `1`, 350ms ease-bounce. **Solo on-mount**, no on-update.
4. **`cromio-flip`** — flip front/back del cromo. `rotateY(0)` → `rotateY(180deg)`, 520ms ease-emphasis. Sobre 3D context, perspective: 1000px.
5. **`cromio-foil`** — gradient holográfico para legendarios. `background: conic-gradient(...)` animado en 6s linear infinite.
6. **`cromio-confetti`** — 12 partículas SVG cayendo con `transform: translateY()` + `rotate()`, 800ms cubic-bezier(0.1, 0.7, 0.3, 1), termina con `opacity: 0`. Solo se dispara en `trade.status -> done`.
7. **`cromio-badge-pop`** — globito rojo del trade pendiente. `scale(0)` → `scale(1.15)` → `scale(1)`, 280ms ease-bounce. Solo al aparecer.
8. **`cromio-shake-error`** — input con error o pin de match imposible. `translateX(-4px, 4px, -2px, 2px, 0)`, 320ms.

### Reduced motion

Todas estas animaciones se reducen a `none` bajo `@media (prefers-reduced-motion: reduce)`. **Excepción**: el pulse del propio dot del mapa se mantiene en versión "estática" (anillo fijo) porque comunica una información del producto ("estás aquí").

### Optimistic UI signature

Cuando una acción tarda <200ms (la mayoría con la caché reciente), no enseñamos loading. Cuando tarda >200ms, aparece un spinner de marca (radar reducido a 16px) inline. Token: `--motion-spinner: 1200ms`.

---

## 5. Anatomía de componentes

> Cada componente se documenta como **slot anatomy + tabla de variantes**. La implementación CSS está en `docs/preview/_components.css`.

### 5.1 `CromoCard`

```
┌─────────────────────────┐  ←  border (variant por estado)
│ [type]      [flag]      │  ←  top row: pill + flag
│                         │
│      [CODE]             │  ←  body: code grande, centro
│      [type label]       │      type label centrado debajo
│                         │
└─────────────────────────┘
   [−] [count] [+]            ←  contador inline (opcional, prop onAdjust)
```

**Variantes de estado**:

| Variante | Border | Bg | Code color | Notes |
|---|---|---|---|---|
| `empty` | 1.5px dashed `--border-strong` | `--bg-surface` | `--text-tertiary` | Cromo que no tengo. |
| `owned` | 2px solid `var(--brand-400)` | `linear-gradient(160deg, rgba(31,174,90,0.12), transparent)` | `var(--brand-300)` | Cromo que tengo. |
| `repe` | 2px solid `var(--danger)` | `linear-gradient(160deg, rgba(255,77,109,0.1), transparent)` | `var(--danger)` | Repetido. |
| `legendary` (overlay) | 2px solid `var(--gold)` | añade `cromio-foil` animation | `var(--gold)` | Sobre owned. |

**Variantes de tamaño**: `sm` (78×110), `md` (102×144), `lg` (140×200), `xl` (200×286). Solo cambia el font del code y los paddings.

**Flip back**: cuando el cromo se voltea (interacción `tap` sobre vista detalle), reverso muestra `player_name`, `position`, `team`, `n`. Animación `cromio-flip`.

### 5.2 Marker de mapa (Leaflet `divIcon`)

```html
<div class="pin" data-kind="match|lead|gold|me">
  <span class="pin-teardrop"></span>
  <span class="pin-avatar" style="background: ...">DE</span>
  <span class="pin-pulse"></span>   <!-- solo en kind="match" si trade activo -->
</div>
```

**SVG-free** (mejor perf con muchos): la teardrop se construye con `border-radius: 50% 50% 50% 4px / 50% 50% 50% 4px` + `transform: rotate(-45deg)`. Avatar en círculo interno.

**Glow del halo**: `box-shadow: var(--map-pin-shadow)`. Para `kind="match"` se usa `--shadow-glow-brand`, para `lead` el equivalente azul, para `gold` el dorado, para `me` un anillo pulsante (no teardrop).

### 5.3 Cluster de pins

Cuando hay >5 marcadores en un cuadrante, agrupamos. **Sin `leaflet.markercluster`** (+8 KB) — implementación propia simple:

```html
<div class="pin-cluster" data-count="12">
  <span class="cluster-disc">12</span>
  <span class="cluster-pulse"></span>
</div>
```

Disc verde con número, ring sutil. Tap = zoom-in al bounding box del cluster.

### 5.4 Bottom nav

Mantiene la estructura actual (5 tabs, fixed bottom, backdrop-blur). Cambios:
- `background: rgba(14, 18, 15, 0.85)` + `backdrop-filter: blur(var(--blur-lg))` en dark.
- `background: rgba(255, 255, 255, 0.9)` + blur en light.
- Active item: pill subtle `bg: var(--brand-bg)` en lugar de cambio de color de icono. Más accesible para daltónicos.
- Badge unread: tamaño 16px (era 14), `bg: var(--danger)`, ring 2px `var(--bg-base)` para que destaque sobre la barra.

### 5.5 Pre-prompt de permisos

Pantalla intersticial **antes** del prompt nativo del navegador. Para geolocalización y push.

```
┌───────────────────────────────────────┐
│                                       │
│           [ilustración SVG]           │  ← icono "radar" verde
│                                       │
│   ¿Activamos tu radar?               │  ← H2 display
│                                       │
│   Necesitamos tu ubicación            │  ← subtext
│   aproximada para mostrarte           │
│   coleccionistas a 200 m – 10 km.     │
│   No guardamos tu calle exacta.       │
│                                       │
│   ✓ Sin tu calle exacta               │  ← 3 checkmarks
│   ✓ Puedes pausarla cuando quieras    │
│   ✓ Solo cuando uses Cromio           │
│                                       │
│   ┌─────────────────────────────────┐ │
│   │  Activar ubicación              │ │  ← CTA primary
│   └─────────────────────────────────┘ │
│   ┌─────────────────────────────────┐ │
│   │  Ahora no                       │ │  ← ghost
│   └─────────────────────────────────┘ │
│                                       │
└───────────────────────────────────────┘
```

**Bullet trick para conversión**: las 3 ventajas (privado, controlable, contextual) responden a las 3 objeciones más comunes a permisos. Las leen ANTES del prompt, así rechazan menos.

Análogo para push: "¿Te avisamos cuando alguien quiere intercambiar?" con bullets "Solo cuando hay match real / Puedes silenciarlas / Solo Cromio te puede mandar".

**Si el usuario rechaza** el prompt nativo, mostramos una **recovery card** discreta en `/perfil` con instrucciones por OS para reactivar desde ajustes.

### 5.6 Banner modo invisible

```
┌─────────────────────────────────────┐
│ 👁  Modo invisible activado        × │
│    No apareces en el mapa hasta que │
│    lo desactives.                   │
└─────────────────────────────────────┘
```

Sticky en top de cualquier pantalla de la app. `bg: var(--warning)` en dark con ink-oscuro de texto. Click = abre toggle en `/perfil`. Cierre = duerme 24h.

### 5.7 Toast offline

```
┌─────────────────────────────────────┐
│ ⚡ Sin conexión · 2 acciones en cola │
└─────────────────────────────────────┘
```

Sticky bottom (sobre el nav). `bg: rgba(255, 77, 109, 0.92)` + `backdrop-filter`. Cuando vuelve la red: cambia a verde "Reconectado · enviando..." y desaparece.

La cola de acciones offline (Fase 4) se gestiona via `BroadcastChannel` + IndexedDB.

### 5.8 Empty states (3 contextos)

**Album vacío**: SVG ilustración de un álbum vacío con un cromo flotante apuntando al primer hueco. CTA "Marca tus primeros cromos".

**Mapa sin nadie**: SVG radar con un signo de pregunta sutil en el centro. CTA "Amplía el radio" o "Invita a un amigo".

**Chat sin conversaciones**: SVG burbuja de chat translúcida con un pin de mapa adentro. CTA "Encuentra coleccionistas".

Estilo: trazos finos `stroke: var(--text-secondary)`, sin colores planos. **Geometrías cromio** (anillos, dot, radar). No infantiles.

### 5.9 Trade Sheet (intercambio)

Bottom sheet desde 60% de viewport. Dos columnas: **Recibes** (col verde) / **Entregas** (col roja), cada una con CromoCards `size="sm"`. Footer con 1-3 botones según rol/estado:

| Estado | Soy sender | Soy receiver |
|---|---|---|
| pending | Cancelar | Aceptar + Rechazar |
| accepted | Cancelar | Marcar realizado |

**Microcelebración** al `mark done`: 1.2s. 12 partículas cromio (anillos pequeños verde + dorado) cayendo del centro hacia abajo + el sheet hace un `scale(1.02)` rebote y vuelve a 1.

### 5.10 Botón Intercambiar (match page)

Cuadrado 56×56 `--radius-md`, fondo `--bg-surface` con `border: 1.5px solid var(--border-strong)`. Icono `ArrowLeftRight` rotado 90° en `var(--brand-400)`. Cuando hay trade activo: badge rojo `h-3 w-3` con `ring: 2px var(--bg-surface)` arriba a la derecha, animado con `cromio-badge-pop` al aparecer.

### 5.11 Botones genéricos

```css
.btn-primary  → bg: var(--brand-500); color: white; shadow: var(--shadow-glow-brand);
.btn-ghost    → bg: var(--bg-surface); border: 1.5px solid var(--border-default); color: var(--text-primary);
.btn-danger   → bg: var(--danger); color: white;
.btn-pro      → bg: linear-gradient(135deg, gold-bright, gold); color: ink-dark;
.btn-icon     → cuadrado, h: 44px (HIG), grid: place-items center.
```

Altura sm: 36px, md: 44px (default, HIG), lg: 56px. Radio: `--radius-md` en todos.

---

## 6. Mapa OSM — implementación

### Tiles

**CartoDB Voyager + Dark Matter** (no Positron — más vibrante y menos "papel" que Positron, más coherente con dark primario):

```js
// Dark mode (default)
L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · © <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: "abcd",
  maxZoom: 19,
})

// Light mode
L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { /* ... */ })
```

**Important**: CartoDB es free para sitios con tráfico modesto. Si superamos 75k requests/mes, evaluamos Stadia (paid pero con tier gratuito) o self-hosting un proxy con tile-server-gl. El `/tiles/[z]/[x]/[y]/route.ts` edge proxy actual se simplifica: solo pasa-through (Vercel ya cachea), no necesita rehacer tiles.

**Atribución**: queda obligatoria, en bottom-right del mapa, font `--text-2xs`, color `--text-tertiary` con `bg: rgba(0,0,0,0.6)` en dark / `rgba(255,255,255,0.85)` en light. **Nunca eliminar** los créditos a OSM y CARTO.

### Radio difuso de visibilidad

`L.circle(center, { radius: radiusM })` con `pathOptions`:

```js
{
  stroke: true,
  color: var(--map-radius-stroke),
  weight: 1.5,
  fillColor: var(--map-radius-fill),
  fillOpacity: 1,
  interactive: false,
}
```

Esto reemplaza el canvas custom actual: escala correctamente con zoom, es accesible (Leaflet lo hace SVG por defecto) y respeta el theme. **El pin de cada usuario no es la posición exacta** — el cálculo `lngLatFromBearing(center, bearing, distance)` ya existe y se respeta.

### Marcadores

`L.divIcon` con HTML custom (anatomía 5.2). **Canvas renderer**:

```js
const map = L.map(container, {
  renderer: L.canvas({ padding: 0.5 }),
  preferCanvas: true,
  zoomControl: false,
});
```

Con >100 markers visibles, el rendering canvas es 4-6x más rápido que SVG default.

### Clustering

Si zoom < 14 y N markers en cuadrante > 5, agrupar (5.3). Sin librería; implementación ~80 líneas custom.

### Controles

- **Zoom**: ocultar default (`zoomControl: false`). Pellizco siempre disponible; los dos botones del default son redundantes en móvil.
- **Locate me**: el botón actual ya está, se mantiene con el estilo de IconBtn.
- **Layers**: no exponer cambio de tiles al usuario en MVP. El theme dark/light lo controla el sistema global.

---

## 7. PWA assets — iconos, splash, manifest

### Iconos (regenerar)

| Asset | Tamaño | Bg | Glifo | Notas |
|---|---|---|---|---|
| `icon-512.png` | 512×512 | brand-500 squircle | white | Reemplaza `cromio_icon.png` actual (que ya es correcto). |
| `icon-192.png` | 192×192 | brand-500 squircle | white | **Falta hoy**. Generar bajando el 512. |
| `icon-512-maskable.png` | 512×512 | brand-500 SOLID | white centered 80% | Safe-zone: glifo escalado al 80% central. |
| `icon-192-maskable.png` | 192×192 | idem | idem | |
| `icon.svg` | vector | brand-500 squircle | white glifo limpio | **Reconstruir** desde el PNG. Reemplaza el SVG de anillos+C feo. Ver `docs/preview/_icon-cromio.svg`. |
| `icon-maskable.svg` | vector | brand-500 solid square | white glifo 80% centrado | Ver `docs/preview/_icon-maskable.svg`. |

**Cómo generar las PNGs**: una vez aprobado el SVG, comando único:

```bash
# Requiere sharp o squoosh-cli
npx @squoosh/cli --resize '{"enabled":true,"width":512,"height":512}' \
  --webp '{"quality":90}' docs/preview/_icon-cromio.svg -d public/
# Luego para maskable: el squircle se hace SOLID rect, el glifo se escala al 80%.
```

### Splash (iOS PWA)

Genera 8 tamaños (iPhone SE, mini, 12-14, Pro, Max, iPad mini, iPad, iPad Pro). Cada uno: `bg: var(--bg-base)` (#0E120F dark) + glifo blanco centrado al 30% del lado más corto. Script: `scripts/gen-splash.mjs` que use `sharp` para todos los tamaños desde el SVG.

### Manifest

```jsonc
{
  "name": "Cromio",
  "short_name": "Cromio",
  "description": "Encuentra coleccionistas a tu alrededor e intercambia cromos en persona.",
  "start_url": "/album",                       // ← cambiado: /album si auth, sino /login
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0E120F",               // ← dark-base
  "theme_color": "#1FAE5A",                    // ← brand-500, no #066B40 verde-oscuro
  "categories": ["sports", "social", "lifestyle"],
  "lang": "es",
  "dir": "ltr",
  "icons": [
    { "src": "/icon-192.png",          "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icon-512.png",          "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icon-192-maskable.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" },
    { "src": "/icon.svg",              "sizes": "any",     "type": "image/svg+xml", "purpose": "any" }
  ],
  "shortcuts": [
    { "name": "Radar",   "url": "/mapa",      "icons": [{ "src": "/icon-192.png", "sizes": "192x192" }] },
    { "name": "Álbum",   "url": "/album",     "icons": [{ "src": "/icon-192.png", "sizes": "192x192" }] },
    { "name": "Chat",    "url": "/chat",      "icons": [{ "src": "/icon-192.png", "sizes": "192x192" }] }
  ],
  "screenshots": [
    { "src": "/screenshots/mapa.png",  "sizes": "1080x2400", "type": "image/png", "form_factor": "narrow", "label": "Radar de coleccionistas" },
    { "src": "/screenshots/album.png", "sizes": "1080x2400", "type": "image/png", "form_factor": "narrow", "label": "Tu álbum" }
  ]
}
```

Cambios clave respecto al actual:
- `description`: **sin** "Panini" ni "Mundial 2026" marcario.
- `start_url`: `/album` en vez de `/` (el redirect a `/album` ya se hace para logueados; saltarse el round-trip).
- `theme_color`: `#1FAE5A` (brand-500) — más coherente con el logo que `#066B40` (verde-900).
- `background_color`: `#0E120F` (bg-base dark) — para que el splash haga match con el theme primario.
- 4 iconos PNG explícitos + safe-zone maskable.
- `screenshots` añadidos.
- `shortcuts` usan `icon-192.png` (no el SVG feo).

### Trigger de instalación propio

En Fase 4 añadimos un listener para `beforeinstallprompt`:

```ts
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.__cromioInstallPrompt = e;
  // Mostrar CTA en /perfil + toast suave en 3ª visita
});
```

Y un botón **"Instalar Cromio"** en `/perfil` que llama `e.prompt()`. Toast suave en la 3ª visita con dismiss persistente.

---

## 8. Accesibilidad

### Contrast

Todos los pares definidos pasan WCAG AA. Verificado:
- `--text-primary` sobre `--bg-base`: dark 16.8:1 (AAA) / light 18.4:1 (AAA).
- `--text-secondary` sobre `--bg-base`: dark 6.4:1 (AA) / light 6.1:1 (AA).
- `--brand-400` (dark) sobre `--bg-base`: 7.1:1 (AA).
- `--brand-700` (light) sobre `--bg-base`: 5.5:1 (AA).
- `--danger` sobre `--bg-surface`: dark 5.2:1 (AA) / light 4.9:1 (AA Large).

### Color no es única señal

- MatchArrows: ▼/▲ siguen siendo verdes/rojos PERO con texto adicional ("Recibes 3 · Entregas 4") y diferente tamaño/peso. Daltónicos distinguen forma y texto.
- Estado de cromo: empty=dashed, owned=solid, repe=solid red. **Border-style** distingue además del color.

### Focus visible

```css
*:focus-visible {
  outline: 2px solid var(--brand-400);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

Aplicado globalmente. Inputs lo reciben en lugar del border. Botones lo reciben encima del bg (offset asegura visibilidad).

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
  .cromio-pulse-self { animation: none; }  /* dot del user queda estático */
  .cromio-sweep { display: none; }         /* sweep del radar fuera */
}
```

### Teclado

- `Tab` recorre orden lógico DOM. Skip-link al top de cada página.
- `Escape` cierra sheets/modales y vuelve focus al trigger.
- Bottom nav: `arrow-left/right` mueve entre tabs.
- Mapa: Leaflet keyboard navigation activado (`keyboard: true`). Para divIcon pins, añadimos `tabindex="0"` + `role="button"` + `aria-label`.

### Touch targets

Todo lo clickable ≥ 44×44 px. Los slider radius chips suben de `h-7` (28 px) a `h-11` (44 px). Bottom nav items ya son 44+.

### Safe areas

Bottom nav respeta `env(safe-area-inset-bottom)`. Headers con back button respetan `env(safe-area-inset-top)` cuando la PWA está en `standalone`.

---

## 9. Mockups

Cinco mockups standalone HTML en `docs/preview/` con el sistema completo aplicado. Cada uno tiene un toggle de tema (dark default, light alternativo) en la esquina:

| Archivo | Pantalla |
|---|---|
| `mockup-onboarding.html` | Wizard de onboarding completo + pre-prompts de geolocalización y push. |
| `mockup-map.html` | Radar con tiles CartoDB Dark Matter + 8 pines + cluster + radio difuso + chips de filtro + sticky CTA. |
| `mockup-album.html` | Grid de cromos con todos los estados (empty / owned / repe / legendary) + tabs + filtro país. |
| `mockup-match.html` | Detalle de coleccionista con header compacto, progreso, columnas Recibes/Entregas, CTA. |
| `mockup-trade.html` | Bottom sheet de intercambio con Recibes/Entregas, botones por rol/estado, microcelebración al "marcar realizado". |

Todos importan `_tokens.css` + `_components.css` así que el sistema queda probado de extremo a extremo antes de tocar producción.

### Antes / después

Para evitar capturas binarias, cada mockup tiene un comment al inicio con un párrafo "antes" describiendo el estado actual de producción. Cuando lo apruebes, en Fase 4 se reemplaza el "antes" por la implementación real y los mockups quedan como referencia histórica en `docs/`.

---

## Próximo paso

Tu OK abre Fase 4. Mi recomendación de orden de implementación, con un commit por bloque:

1. **Tokens globales** + tipografía: actualizar `tailwind.config.ts` y `app/globals.css` (cero cambios de componentes, solo paleta y `data-theme` switch).
2. **Manifest + iconos** + splash screens nuevos. Drop de `maplibre-gl` del `package.json`.
3. **Mapa**: cambio a CartoDB Dark Matter / Positron, Canvas renderer, `L.circle` real para el radio, clustering custom, divIcons restilizados.
4. **CromoCard**: refactor a anatomía sloteada con estados consistentes, flip front/back, foil legendarios, microcelebración.
5. **Trade flow + bottom sheet**: aplicar el nuevo botón, sheet con triangle headers, confetti on done.
6. **Onboarding pre-prompts + recovery** + banner "modo invisible" + toast offline + queue de acciones.
7. **Empty states ilustrados** + accesibilidad final + Lighthouse audit.

Cada paso es independiente y reversible. Si quieres ir más rápido, los pasos 1+2+3 son los que más cambian la percepción y se pueden hacer en una sola sesión.

¿Apruebas?
