# Cromio — Direcciones visuales · Fase 2

> Decisiones cerradas en este punto:
> - **Dark mode**: auto por OS + override manual en `/perfil`.
> - **Variable fonts**: sí, exploramos modernas.
> - **Mapa OSM**: alternativa **(a) tiles alternativos** — CartoDB Positron en day, Dark Matter en night. Sin migración a MapLibre.
> - **MapLibre**: se elimina del `package.json` en Fase 4.
> - **"Mundial 2026"**: se permite como contexto textual; sin escudos/marcas oficiales.
> - **Install prompt propio**: sí, captura de `beforeinstallprompt` con CTA en `/perfil` + toast suave.

---

## 0. Diagnóstico de producto (no solo estético)

Después de la auditoría, estos son los **5 problemas a nivel producto** que el redesign tiene que resolver. No son cosméticos.

1. **Cromio no se ve cuando se usa.** El uso real es en la calle, a pleno sol, con una mano, mirada de 5 segundos. El verde del logo + el mapa OSM "standard" se pisan, los pines pierden contraste y los textos secundarios (`#5C5A50` sobre bone) caen en el límite de WCAG AA. La marca pide presencia y la app pide legibilidad: hoy chocan.

2. **La promesa "radar" se diluye.** El logo dice "radar". El producto es "radar". Pero el mapa es genérico: igual lo podría haber dibujado cualquier app de delivery. La marca y el producto no se refuerzan visualmente.

3. **Los cromos no se sienten cromos.** Hoy un `CromoCard` es una tarjeta con borde. No hay textura, no hay flip, no hay rareza visual. Para una app de coleccionismo, los cromos deberían ser el activo más cuidado del sistema; son tarjetas SaaS.

4. **El producto pide permisos sin negociar.** Geolocalización + Push aparecen sin contexto. Los usuarios que rechazan no tienen recovery. Esto recorta el TAM antes de que la app pueda funcionar.

5. **La gamificación queda implícita.** Hay álbum, repes, matches, intercambios — material para subir engagement con barras de progreso, streaks, hitos, microcelebraciones. Hoy todo se comunica con texto plano. La gente colecciona porque coleccionar es divertido; el producto no celebra eso.

(Saldría un sexto sobre dark mode + outdoor mode, pero ya está cubierto por las decisiones de arriba.)

Las 3 direcciones de abajo se evalúan **contra estos 5 problemas**.

---

## Dirección 1 · **"Estadio nocturno"**

Dark mode como **primary identity**. La app vive de noche aunque el OS esté en light. Light mode es solo un alternativo "para el sol".

### Paleta (derivada del verde #1FAE5A del logo)

| Token | Hex | Uso |
|---|---|---|
| `brand.500` | `#1FAE5A` | Verde de marca (idéntico al logo). |
| `brand.400` | `#3DCB7A` | Pin de match en mapa oscuro, hover, glow. |
| `brand.300` | `#7BE5A6` | Acento brillante (texto sobre fondo dark). |
| `brand.700` | `#0E7E3F` | CTA presionado, success bg dark. |
| `brand.900` | `#053A1E` | Acento estructural sobre dark. |
| `neutral.50` | `#F8FAF8` | Texto en dark / superficie en light. |
| `neutral.300` | `#A8B0AA` | Texto secundario en dark. |
| `neutral.700` | `#2E332F` | Border en dark. |
| `neutral.900` | `#0E120F` | Fondo base dark (no negro puro — ligero tinte verde). |
| `neutral.950` | `#070908` | Sombra profunda dark. |
| `gold` | `#F5C518` | Legendarios + Pro. Solo en dark brilla bien. |
| `match.give` | `#FF4D6D` | Entregas (rojo neón sobre dark). |
| `match.lead` | `#5BB4FF` | "Te interesa" (azul cielo neón). |

**Contraste WCAG AA**: `neutral.50` sobre `neutral.900` = 16.8:1 ✅ AAA. `neutral.300` sobre `neutral.900` = 6.4:1 ✅ AA. `brand.400` sobre `neutral.900` = 7.1:1 ✅ AA.

### Tipografía
- **Display**: **Geist Sans Variable** (1 axis: weight 400→900). Geométrica, moderna, alto contraste. Reemplaza Bebas — más versátil porque tiene pesos completos.
- **Texto UI**: **Inter Variable** (mantener). Es lo más legible a 13-14px en móvil.
- **Mono / data**: **Geist Mono Variable** (para los números de cromos `#125`, distancias `1.2km`).

Tamaños base: 13px UI / 16px body / 22px display sm / 32px display md / 48px display lg (responsive con `clamp`).

### Mapa
- **CartoDB Dark Matter** en day también (un acento visual fuerte: "Cromio es dark, siempre"). Si el usuario activa light mode → CartoDB Positron, pero invitando a volver a dark.
- Los **pines de match** son teardrops verde neón con halo radial; los avatares se incrustan dentro. Hover/tap → micro-pulso.
- El **radar del usuario** se rediseña como onda neón pulsante (igual concepto que hoy pero con neon verde sobre dark legible).
- **Atribución OSM + CartoDB** en bottom-right, fuente `font-size: 9px; color: rgba(255,255,255,.5)`.

### Cromos
- Tratamiento **glass card sutil**: gradient bg `rgba(255,255,255,.03)` con borde `rgba(255,255,255,.1)`, dentro la información del cromo en alto contraste.
- **Legendarios**: foil holográfico CSS (`background: conic-gradient` animado lento) + sombra dorada. Lo que hoy es un pill text se convierte en el centro visual de la card.
- **Repes**: borde rojo neón pulsante MUY discreto (no rojo sólido).
- **Flip front/back** con CSS 3D transform: el reverso muestra "Número + posición + país" como reverso real de cromo.

### Pin de mapa (anatomía)
```
   [avatar 28px circular, borde brand.400]
   ┐ teardrop dark con halo verde neón
   ┘
```
Variantes: `match` (halo brand.400), `lead` (halo match.lead), `pro` (halo gold), `me` (azul/me marker con onda).

### Personalidad y tono
- Energía nocturna, premium, "noche de partido".
- Referente visual: Strava dark + Linear + un toque de Cyberpunk 2077 contenido (sin caer en neón saturado).
- "Cromio no duerme, busca matches contigo."

### Pros
- ✅ Soluciona el problema #1 (legibilidad al sol) inmediatamente: dark + alto contraste se ve mejor outdoor de lo que se cree, sobre todo con OLED.
- ✅ Resuelve el #2 (radar): el mapa oscuro + el pulse neón + el logo verde son **la misma idea** repetida.
- ✅ El verde de marca brilla más sobre dark que sobre bone.
- ✅ Encaja perfecto con notificaciones push (que llegan de noche, fin del partido, fin de jornada).
- ✅ "Más caro de hacer" visualmente pero técnicamente igual de barato.

### Contras
- ❌ Riesgo de "app demasiado seria" — el coleccionismo tiene un punto lúdico que se pierde si todo es dark/premium.
- ❌ El público objetivo del Mundial 2026 incluye niños/padres; dark puede sentirse menos accesible para ese segmento.
- ❌ El switching a light (cuando lo activan) requiere mantener dos paletas perfectamente equilibradas — más trabajo de Fase 4.

### Impacto en performance
- Bundle: igual (cambia el theme, no la librería).
- LCP: ligeramente mejor en OLED (menos píxeles encendidos = menos work del compositor).
- Mapa: CartoDB Dark Matter pesa ~25 KB por tile (similar a OSM standard).

---

## Dirección 2 · **"Álbum vivo"**

Light primario, dark secundario. Estética **álbum de cromos de toda la vida pero moderno**. Es la opción "papel" — táctil, nostálgica, confiable.

### Paleta

| Token | Hex | Uso |
|---|---|---|
| `brand.500` | `#1FAE5A` | Verde marca (idéntico al logo). |
| `brand.600` | `#179049` | Estados hover/press claros. |
| `brand.50` | `#E8F8EE` | Bg suave de match en cards. |
| `brand.100` | `#CDEFD9` | Chip "match" sobre bone. |
| `neutral.0` | `#FFFFFF` | Cards. |
| `paper` | `#F6F1E6` | **Fondo base** — papel cálido, no blanco. Microtono crema. |
| `bone` | `#FDFBF5` | Fondo alternativo. |
| `ink.900` | `#1A1614` | Texto principal — casi negro con tinte cálido. |
| `ink.500` | `#5C544B` | Texto secundario. Pasa AA sobre paper (5.2:1). |
| `line` | `#E0D9C8` | Bordes, separadores. |
| `gold` | `#C58F0F` | Legendarios + Pro. Más mate que en dark. |
| `match.give` | `#D7263D` | Entregas. Saturado para destacar sobre paper. |
| `match.lead` | `#1659D6` | "Te interesa". |

**Dark mode**: `brand.500` sube a `brand.400 = #3DCB7A`. Bg → `#15110D`. Texto principal → `#F8F4EB`. Mantenemos calidez en dark (no neutro frío).

### Tipografía
- **Display**: **Bebas Neue** (mantener — es iconico para sports/álbum) PERO en parejas con **Anton Variable** o **Geist Sans** ExtraBold para variar grosores donde Bebas falla (Bebas solo tiene una weight).
- **Texto UI**: **Public Sans Variable** (gobierno US, alta legibilidad, axis weight 100-900). O **Inter Variable** si preferimos lo conocido.
- **Numerales tabulares**: **Inter Variable** con `font-feature-settings: "tnum"` o **JetBrains Mono** como hoy.

Sensación: titulares de revista deportiva + tipografía de cuerpo limpia.

### Mapa
- **CartoDB Positron** como base. Limpio, papel-friendly, deja respirar a los pines.
- Pines **estilo "sticker pegado al mapa"** — fondo papel + borde grueso (`stroke-width: 3`) + avatar dentro. Tienen una pequeña sombra "como si estuvieran levantados del mapa" (CSS `filter: drop-shadow(0 4px 6px rgba(0,0,0,.15))`).
- **Radar del usuario** como anillo difuminado verde con un dot center sólido, sin sweep agresivo. Más calmado.
- **Atribución OSM + CartoDB** en bottom-right, fuente `font-size: 9.5px; color: rgba(0,0,0,.4)`.

### Cromos
- **Sticker tactile**: borde más marcado, esquinas redondeadas tipo cromo físico (12px), pequeña inclinación residual al aparecer (`rotate(-0.5deg)`) para evocar "pegado a mano".
- **Legendarios**: brillo dorado sutil con `background: linear-gradient(105deg, gold, transparent 40%, transparent 60%, gold)` animado al hover.
- **Repes**: badge rojo en corner top-right (no border completo) — más fiel a la lectura "tengo dos" de un álbum real.
- **Flip front/back** con CSS 3D transform: reverso con dato del jugador.

### Pin de mapa (anatomía)
```
   ┌────────┐  ← sticker rect con esquinas 8px
   │ avatar │
   │ 36px   │
   └────────┘
   ▽         ← cola triangular (no teardrop redondo)
```
Pequeño, plano, papel.

### Personalidad y tono
- Cálido, deportivo, generacional. "Tu álbum de toda la vida, ahora con radar."
- Referencias: el Panini de los 90s, Notion (la calidez del papel), Apple Books.
- Funciona genial para abuelos enseñando a nietos, padres ayudando a niños.

### Pros
- ✅ Resuelve #3 (los cromos no se sienten cromos) **muy bien** — toda la dirección gira sobre eso.
- ✅ Mejora #1 (sol) parcialmente: CartoDB Positron es muy legible outdoor; el `paper` es menos brillante que `#FFFFFF`.
- ✅ Más accesible para todos los segmentos (niños, padres, abuelos, hipsters).
- ✅ El verde de marca brilla sobre paper porque hay contraste de calidez (verde fresco vs crema), no solo de luz.

### Contras
- ❌ Riesgo de "demasiado clásico", quedarse atrás si Strava/Pokemon GO van por dark moderno.
- ❌ No resuelve el problema #2 (radar) tan bien — el papel es el opuesto conceptual de un radar electrónico.
- ❌ Dark mode se siente como afterthought (porque lo es).

### Impacto en performance
- Bundle: igual.
- LCP: igual o levemente peor (paper = más píxeles encendidos en LCD móvil).
- Mapa: CartoDB Positron pesa ~22 KB por tile.

---

## Dirección 3 · **"Fiesta mundialista"**

Multicolor controlado: verde de marca + acentos vibrantes derivados de las **6 grandes selecciones** (rojo, azul, amarillo, blanco, naranja, granate). La paleta no es "verde con cosas"; es "verde + 5 acentos competitivos coexistiendo".

### Paleta

| Token | Hex | Uso |
|---|---|---|
| `brand.500` | `#1FAE5A` | Verde marca. |
| `accent.red` | `#E5006D` | Acento 1 — México, intensidad. |
| `accent.blue` | `#1E78FF` | Acento 2 — USA, leads. |
| `accent.gold` | `#F5C518` | Acento 3 — celebración, legendarios. |
| `accent.orange` | `#EF8C20` | Acento 4 — España/PT, hover. |
| `accent.violet` | `#7C3BFF` | Acento 5 — Pro. |
| `neutral.50` | `#F8F8FA` | Bg neutro (frío, no cálido). |
| `neutral.100` | `#EFEFF2` | Cards. |
| `ink.900` | `#0E0F12` | Texto principal. |
| `ink.500` | `#5A5C66` | Texto secundario. |

**Dark mode**: `brand.500` se mantiene, neutros viran a `#0E0F12 / #181922`, acentos se intensifican +10% luminosidad.

### Tipografía
- **Display**: **Cabinet Grotesk Variable** (axis weight 100-900) — geométrica, bouncy, deportiva sin ser tipográficamente "noticiero".
- **Texto UI**: **Manrope Variable** (axis 200-800) — geométrica, redondez sutil.
- **Mono**: **JetBrains Mono Variable**.

Sensación: deportiva moderna con personalidad gráfica fuerte.

### Mapa
- **CartoDB Positron** como base — pero la magia está en los pines.
- Los **pines de match heredan el color del país favorito** del coleccionista. Si Marcos favoreció Argentina, su pin es albiceleste con franja; si Paula prefiere Brasil, amarillo+verde+azul. Esto convierte el mapa en **una visualización emocional**: ves "tu tribu" de un vistazo.
- **Radar del usuario** mantiene verde neutral (eres tú, no una selección).
- Pin teardrop con bandera estilizada (sin escudo, solo colores y franjas).

### Cromos
- **Flat moderno**: bloques de color sólido del país, tipografía display gigante con el número, sin sombras pesadas.
- **Legendarios**: gradient conic animado, micro-confetti al hacer flip por primera vez (canvas ligero, no librería).
- **Repes**: badge color sólido del país del cromo en la esquina (no rojo plano).
- **Flip** + microanimaciones de celebración cuando completas un grupo (toda una selección, todos los Estadios, etc.).

### Pin de mapa (anatomía)
```
   ┌──┐
   │██│  ← franja del país en top (estilizada, sin escudo)
   │👤│  ← avatar del user en círculo, debajo
   └▽┘
```

### Personalidad y tono
- Festivo, alto-ánimo, comunitario.
- Referencias: Eurovision graphics, FIFA video games UI, Pokémon GO event UI.
- "El Mundial son las personas. Aquí están todas."

### Pros
- ✅ Resuelve #5 (gamificación) directamente — todo invita a celebrar.
- ✅ Convierte el mapa en señal emocional: "veo cuántos argentinos hay cerca" es una feature gratis derivada de la paleta.
- ✅ Más diferenciador en tienda de PWA (la mayoría de apps coleccionistas son monocrómicas).
- ✅ Encaja perfecto con campañas de marketing temporales (octavos, cuartos, semifinales).

### Contras
- ❌ Riesgo real de saturación. 5 acentos + verde + estados semánticos = mucho color en pantalla. Hay que disciplina ferrea o cae en "casino".
- ❌ Los pines país-coloreados pueden ser ilegibles si dos países cercanos comparten paleta (Italia/Hungría/México).
- ❌ Más costoso en Fase 4: cada componente tiene que probar 6+ variantes de color.
- ❌ Dark mode más difícil de balancear (5 acentos × 2 modos = 10 tunings).

### Impacto en performance
- Bundle: levemente mayor (tabla de colores por país en JS, ~3 KB).
- LCP: igual.
- Mapa: tiles iguales. Pero más SVG por pin (bandera estilizada) = +~1 KB por marker. Con 100 markers visibles aún cómodo.

---

## Tabla comparativa rápida

| | Estadio nocturno | Álbum vivo | Fiesta mundialista |
|---|---|---|---|
| Resuelve sol/legibilidad (P #1) | ★★★ (dark + OLED) | ★★ (paper > white) | ★★ (Positron OK) |
| Refuerza "radar" (P #2) | ★★★ | ★ | ★★ |
| Cromos = cromos (P #3) | ★★ | ★★★ | ★★★ |
| Pre-prompts amables (P #4) | ★★ | ★★★ (cálido invita) | ★★ |
| Gamificación (P #5) | ★★ | ★★ | ★★★ |
| Esfuerzo Fase 4 | medio | medio | alto |
| Diferenciación | media | baja | alta |
| Riesgo "infantil/casino" | bajo | bajo | medio-alto |
| Riesgo "frío/no-fiesta" | medio | bajo | bajo |

## Mi recomendación

**Empezamos con la 1 (Estadio nocturno), pero pedimos prestado de la 3 (Fiesta) las microcelebraciones y el flip de cromo, sin la paleta multicolor.**

Tres razones:

1. El problema número uno operativo es el sol/contraste y los pines del mapa que no se ven. Dark hace eso sin esfuerzo.
2. El logo es un radar verde sobre fondo nítido — sobre dark es exactamente lo que dice ser. Sobre paper se siente como "logo casual".
3. Es la dirección más coherente con la propuesta de la PWA (instalable, push notifs nocturnas, uso outdoor): es la única que se siente como un producto "always on".

Lo que me preocupa de ir 100% con la 1 es el riesgo de que se sienta seria. Por eso recomiendo robar a la 3 los gestos de celebración (cuando completas un grupo, micro-confetti; cuando aceptas un trade, un pulse satisfactorio del avatar; cuando se cierra un trade, dos check-marks animados). Eso mantiene la energía mundialista sin saturar el sistema con 6 acentos competitivos.

La 2 me parece la dirección más **segura comercialmente** (apela a todos los segmentos) pero la **menos diferenciadora**. Si el negocio dice "necesitamos parecernos a Panini y bajar el riesgo de extrañar a usuarios mayores", va la 2.

La 3 la guardaría para una **piel de evento** (durante los partidos del Mundial real, activamos una "piel fiesta" temporal sobre la base 1). Eso es muy potente como táctica de retención sin comprometer la base.

## Para decidir

Contesta una de estas tres:
- **A. Estadio nocturno** (mi voto)
- **B. Álbum vivo**
- **C. Fiesta mundialista**
- **D. Combinación**: dime cuál es la base y qué tomo prestado de las otras.

Mientras decides, en `docs/preview/` están los **3 mini-previews HTML** (color swatches + pin demo + cromo demo + botón) standalone — ábrelos en el navegador para ver cada dirección con tus ojos, no solo con texto.

- `docs/preview/direction-1-estadio-nocturno.html`
- `docs/preview/direction-2-album-vivo.html`
- `docs/preview/direction-3-fiesta-mundialista.html`
