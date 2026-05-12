# Cromio — Análisis del logo

> Documento de Fase 1. Esta lectura del logo es el punto de partida del sistema de diseño: cualquier color o decisión visual posterior tiene que armonizar con lo que el logo ya establece.

## Activos encontrados

| Archivo | Tipo | Notas |
|---|---|---|
| `public/cromio_icon.png` | 512×512 PNG (raster) | **Logo de marca real.** Squircle verde sobre fondo transparente con un glifo blanco. Es el que sirve la PWA como icono de instalación. |
| `public/icon.svg` | SVG | **Fallback programático** — anillos concéntricos verde oscuro → verde claro → blanco → dorado con una "C" Bebas centrada. No coincide con la identidad real; parece una solución de emergencia para tener un asset vectorial. |
| `public/icon-maskable.svg` | SVG maskable | Mismas formas concéntricas que `icon.svg` sin la C, pensado para la safe-zone maskable de Android. |
| `public/radar_cromio.png` | PNG (casi blanco) | Marker overlay para el mapa. Casi vacío visualmente, no es logo. |

**Conclusión**: solo hay **un logo "de verdad"** (cromio_icon.png). El SVG es un placeholder. Si el redesign quiere conservar vectorial, hay que reconstruir el glifo del PNG como SVG.

## Lectura visual del logo real

### Forma contenedora
- **Squircle** (cuadrado con esquinas muy redondeadas, ≈ 96 px de radio sobre 512 px de lado). Lectura cercana al icon shape de iOS y al rounded-rect de Material.
- No tiene borde, no tiene sombra: es plano, sólido y va a destacar mejor sobre fondos claros que sobre fondos verdes.

### Paleta
Extraída del PNG (medidas aproximadas, ±3 sobre cada canal):

| Rol | Hex | Uso en el logo | Notas |
|---|---|---|---|
| Primario | **#1FAE5A** | Relleno del squircle | Verde césped vibrante, alto chroma. **Es el color de marca.** Coincide con el `DEFAULT_COLOR` del avatar en `lib/data` y con la familia `green-500: #10C56A` de la tailwind config (cercano pero no idéntico). |
| Contraste | **#FFFFFF** | Glifo interior | Blanco puro. Define el contorno del símbolo. |
| Acento existente (fuera del logo) | **#066B40** | `themeColor` del manifest, `green-900` de tailwind | Verde oscuro, ya usado para barra del navegador. Funciona como neutro oscuro de marca. |

La paleta real del logo es **bicolor**: verde césped + blanco. Cualquier color extra del sistema (dorado, rojo, azul) tiene que justificarse como semántico, no como decorativo, para no diluir la identidad.

### El glifo
El símbolo blanco dentro del squircle es **un cromo en forma de disco/radar**: un anillo casi cerrado con una apertura a la derecha, un punto central enmarcado en un círculo, y un pequeño punto satélite que se asoma a las 5 del reloj.

**Tres lecturas válidas que conviven**:
1. **Cromio = cromo** — el círculo es la sombra de un cromo redondo.
2. **Cromio = radar** — el anillo abierto + el dot central evocan un sonar / un radar barriendo.
3. **Cromio = intercambio** — la asimetría del anillo sugiere movimiento circular, *swap*.

Las tres están perfectamente alineadas con el producto: **un radar social para encontrar a quién tiene/necesita tus cromos**. El logo ya cuenta la historia, no hay que pelearse con él.

### Tipografía implícita
- El logo no contiene texto.
- El SVG fallback usa **Bebas Neue** para la C — confirmada como tipografía de display del sistema (`var(--font-bebas)`).
- El brand stack actual ya añade **Inter** (texto UI) y **JetBrains Mono** (mono). Es la pareja correcta: Bebas para titulares estilo deportivo, Inter para legibilidad densa, mono solo cuando sea data tabular.

### Personalidad y tono
- **Energético**: el verde chroma 60+ no es un verde corporativo; vibra.
- **Lúdico-deportivo, sin ser infantil**: la geometría simple y la ausencia de sombras "fun" lo mantienen adulto.
- **Confiable**: el equilibrio simétrico del squircle y el contraste alto transmiten orden, no caos.
- **Comunitario por proximidad**: la lectura "radar" empuja la marca hacia *hyperlocal*, *en vivo*, *aquí y ahora*.
- **Anti-FIFA/Panini**: no hay nada en el logo que evoque escudos, balones oficiales ni medallas. Esto facilita la cláusula contractual "app independiente".

## Implicaciones para el sistema de diseño

1. **Verde como protagonista, pero acotado.** El #1FAE5A no puede ser el fondo de la app en una pantalla blanca con un texto pequeño porque pierde fuerza y satura. Funciona como acento masivo (chips activos, CTAs, marcadores propios en el mapa) y como **color del estado positivo / match**. Para superficies grandes hace falta una segunda escala neutra muy desaturada.

2. **Neutros desaturados, no grises puros.** Los grises 100 % neutros chocan con el verde alto-chroma del logo. Una escala de neutros con un microtono verde (≈ HSL 140 5 %) hace que el verde se sienta integrado en lugar de "pegado".

3. **Acentos secundarios disponibles, restringidos.** El sistema necesita rojo (entregas/errores), ámbar (warnings), azul/violeta (info, Pro). El dorado #D4AF37 que aparece en el SVG fallback puede recuperarse como acento de Pro/legendario (ya está en `tailwind.config.ts` como `gold`).

4. **Modo oscuro coherente.** Si el verde primario tiene que vivir en dark, hay que subir la luminosidad ~12 % y bajar la saturación ~8 % para evitar el efecto "neón". Los neutros oscuros también tintados de verde.

5. **El glifo como motif del producto.** El anillo-radar abierto puede reaparecer como elemento decorativo en estados vacíos, en el splash, en los anillos del mapa. Refuerza la conexión "logo ↔ producto" sin ser invasivo.

6. **El logo se respira sobre fondo claro.** Su misión es contraste sobre wallpaper de OS, donde el squircle verde tiene que destacar. Para uso *dentro* de la UI sobre fondos verdes, hay que usar la versión inversa (squircle blanco con glifo verde) — esta versión hay que crearla.

## Versiones a producir (Fase 3)

- **Lockup horizontal**: glifo + wordmark "CROMIO" en Bebas, para headers y la landing.
- **Glifo en blanco sobre verde**: para PWA install splash + favicon dark.
- **Glifo en verde sobre blanco**: para superficies oscuras de la UI.
- **Wordmark suelto**: en `text-text` (#1A1A1A) para footers.
- **Reconstrucción SVG limpia del glifo del PNG**: para iconos de cualquier tamaño sin pérdida.

## Cromio en una frase

> "Un radar verde que te dice quién tiene tu cromo a 200 metros."

Todo lo que el sistema de diseño produzca debería ser legible bajo esa frase. Si una decisión visual no sirve a esa intención (vibrante, ubicuo, deportivo, hiperlocal, social), conviene revisarla.
