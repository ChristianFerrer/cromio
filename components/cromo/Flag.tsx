import type { Country, FlagDirection } from "@/lib/types";

/**
 * SVG-based country flag. Uses a 100x100 viewBox so glyphs (sun, star, rhombus)
 * land at predictable coordinates regardless of `size`. The wrapping <rect>'s
 * `clipPath` confines every overlay so we can never have an absolutely-
 * positioned dot escape the viewport (the original Argentina sun bug).
 *
 * Special-cased flags whose geometry doesn't reduce cleanly to {h, v, cross,
 * d, solid} — Argentina sun, Brazil rhombus + globe, Korean taegukgi, Jordan
 * chevron, Scotland saltire, AUS/NZL Union Jack canton — get their own
 * <Special*> renderer below.
 */
export function Flag({
  country,
  size = 24,
  rounded = true,
}: {
  country: Country | undefined;
  size?: number;
  rounded?: boolean;
}) {
  if (!country) return null;
  const radiusPx = rounded ? Math.round(size / 6) : 0;
  const rx = rounded ? 14 : 0;
  const clipId = `flag-clip-${country.code}`;

  const inner = renderFlag(country);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ borderRadius: radiusPx }}
      role="img"
      aria-label={`Bandera de ${country.name}`}
      className="block shrink-0"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width="100" height="100" rx={rx} ry={rx} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>{inner}</g>
      <rect
        x="0.5"
        y="0.5"
        width="99"
        height="99"
        rx={rx}
        ry={rx}
        fill="none"
        stroke="rgba(0,0,0,0.12)"
        strokeWidth="1"
      />
    </svg>
  );
}

function renderFlag(country: Country) {
  switch (country.code) {
    case "ARG":
      return <ArgentinaFlag colors={country.flag.colors} dot={country.flag.dot} />;
    case "BRA":
      return <BrazilFlag colors={country.flag.colors} />;
    case "JPN":
      return <JapanFlag />;
    case "KOR":
      return <KoreaFlag />;
    case "AUS":
      return <AustraliaFlag />;
    case "NZL":
      return <NewZealandFlag />;
    case "SCO":
      return <ScotlandFlag />;
    case "JOR":
      return <JordanFlag />;
    case "USA":
      return <UsaFlag />;
    case "CAN":
      return <CanadaFlag />;
    case "MEX":
      return <MexicoFlag />;
    case "ENG":
      return <EnglandFlag />;
    case "SUI":
      return <SwissFlag />;
    case "TUR":
      return <TurkeyFlag />;
    case "POR":
      return <PortugalFlag />;
    case "ESP":
      return <SpainFlag />;
    default:
      return <GenericFlag flag={country.flag} />;
  }
}

function GenericFlag({ flag }: { flag: { dir: FlagDirection; colors: string[]; dot?: string } }) {
  const { dir, colors } = flag;

  if (dir === "h") {
    return <HorizontalBands colors={colors} />;
  }
  if (dir === "v") {
    return <VerticalBands colors={colors} />;
  }
  if (dir === "cross") {
    return <GreekCross colors={colors} />;
  }
  if (dir === "d") {
    return <DiamondField colors={colors} />;
  }
  // solid (single block, optional second color as central disc)
  return (
    <>
      <rect x="0" y="0" width="100" height="100" fill={colors[0]} />
      {colors[1] && <circle cx="50" cy="50" r="22" fill={colors[1]} />}
      {flag.dot && <circle cx="50" cy="50" r="9" fill={flag.dot} />}
    </>
  );
}

function HorizontalBands({ colors }: { colors: string[] }) {
  const h = 100 / colors.length;
  return (
    <>
      {colors.map((c, i) => (
        <rect key={i} x="0" y={i * h} width="100" height={h + 0.5} fill={c} />
      ))}
    </>
  );
}

function VerticalBands({ colors }: { colors: string[] }) {
  const w = 100 / colors.length;
  return (
    <>
      {colors.map((c, i) => (
        <rect key={i} x={i * w} y="0" width={w + 0.5} height="100" fill={c} />
      ))}
    </>
  );
}

function GreekCross({ colors }: { colors: string[] }) {
  const [bg, fg] = colors;
  return (
    <>
      <rect x="0" y="0" width="100" height="100" fill={bg} />
      <rect x="42" y="0" width="16" height="100" fill={fg} />
      <rect x="0" y="42" width="100" height="16" fill={fg} />
    </>
  );
}

function DiamondField({ colors }: { colors: string[] }) {
  // Used for Brazil-style: bg + rhombus + central element. Generic fallback.
  const [bg, mid, dot] = colors;
  return (
    <>
      <rect x="0" y="0" width="100" height="100" fill={bg} />
      <polygon points="50,12 88,50 50,88 12,50" fill={mid ?? bg} />
      {dot && <circle cx="50" cy="50" r="14" fill={dot} />}
    </>
  );
}

/* ---------- Special flags ---------- */

function ArgentinaFlag({
  colors,
  dot,
}: {
  colors: string[];
  dot?: string;
}) {
  const [sky, white] = colors;
  const sun = dot ?? "#F5C642";
  // Sun rays as 16 thin rectangles around the disc.
  const rays = Array.from({ length: 16 }).map((_, i) => {
    const angle = (i * 360) / 16;
    return (
      <rect
        key={i}
        x="49"
        y="36"
        width="2"
        height="6"
        fill={sun}
        transform={`rotate(${angle} 50 50)`}
      />
    );
  });
  return (
    <>
      <rect x="0" y="0" width="100" height="33.5" fill={sky} />
      <rect x="0" y="33" width="100" height="34.5" fill={white} />
      <rect x="0" y="66.5" width="100" height="34" fill={sky} />
      {rays}
      <circle cx="50" cy="50" r="9" fill={sun} />
      <circle cx="50" cy="50" r="9" fill="none" stroke="#9C7B1F" strokeWidth="0.8" />
    </>
  );
}

function BrazilFlag({ colors }: { colors: string[] }) {
  const [green, yellow, blue] = colors;
  return (
    <>
      <rect x="0" y="0" width="100" height="100" fill={green} />
      <polygon points="50,15 87,50 50,85 13,50" fill={yellow} />
      <circle cx="50" cy="50" r="18" fill={blue} />
      <path
        d="M32 47 Q50 38 68 47"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        fill="none"
      />
    </>
  );
}

function JapanFlag() {
  return (
    <>
      <rect x="0" y="0" width="100" height="100" fill="#FFFFFF" />
      <circle cx="50" cy="50" r="22" fill="#BC002D" />
    </>
  );
}

function KoreaFlag() {
  // Taegukgi: white field with red+blue yin-yang and 4 trigrams (simplified to 3 bars each)
  return (
    <>
      <rect x="0" y="0" width="100" height="100" fill="#FFFFFF" />
      {/* yin-yang */}
      <circle cx="50" cy="50" r="20" fill="#CD2E3A" />
      <path
        d="M50 30 A20 20 0 0 1 50 70 A10 10 0 0 0 50 50 A10 10 0 0 1 50 30 Z"
        fill="#0047A0"
      />
      {/* trigrams (top-left, top-right, bottom-left, bottom-right) — simplified bars */}
      <g fill="#0E0E0E">
        {/* top-left: 3 solid bars */}
        <rect x="14" y="20" width="14" height="2" />
        <rect x="14" y="24" width="14" height="2" />
        <rect x="14" y="28" width="14" height="2" />
        {/* top-right: 3 split bars */}
        <rect x="72" y="20" width="6" height="2" />
        <rect x="80" y="20" width="6" height="2" />
        <rect x="72" y="24" width="14" height="2" />
        <rect x="72" y="28" width="6" height="2" />
        <rect x="80" y="28" width="6" height="2" />
        {/* bottom-left: 1 solid + 2 split */}
        <rect x="14" y="70" width="14" height="2" />
        <rect x="14" y="74" width="6" height="2" />
        <rect x="22" y="74" width="6" height="2" />
        <rect x="14" y="78" width="14" height="2" />
        {/* bottom-right: 3 split */}
        <rect x="72" y="70" width="6" height="2" />
        <rect x="80" y="70" width="6" height="2" />
        <rect x="72" y="74" width="6" height="2" />
        <rect x="80" y="74" width="6" height="2" />
        <rect x="72" y="78" width="14" height="2" />
      </g>
    </>
  );
}

function UnionJackCanton({ x = 0, y = 0, w = 50, h = 33.3 }) {
  // Simplified Union Jack — fits in a wxh rect at x,y.
  const sx = w / 50;
  const sy = h / 30;
  return (
    <g transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
      <rect x="0" y="0" width="50" height="30" fill="#012169" />
      {/* white saltire */}
      <path d="M0 0 L50 30 M50 0 L0 30" stroke="#FFFFFF" strokeWidth="6" />
      {/* red saltire (St Patrick) — thinner offset */}
      <path d="M0 0 L50 30 M50 0 L0 30" stroke="#C8102E" strokeWidth="2.2" />
      {/* white cross */}
      <rect x="0" y="12" width="50" height="6" fill="#FFFFFF" />
      <rect x="22" y="0" width="6" height="30" fill="#FFFFFF" />
      {/* red cross */}
      <rect x="0" y="13.5" width="50" height="3" fill="#C8102E" />
      <rect x="23.5" y="0" width="3" height="30" fill="#C8102E" />
    </g>
  );
}

function AustraliaFlag() {
  return (
    <>
      <rect x="0" y="0" width="100" height="100" fill="#012169" />
      <UnionJackCanton x={0} y={0} w={50} h={50} />
      {/* Commonwealth star */}
      <Star cx={25} cy={75} r={6} fill="#FFFFFF" />
      {/* Southern Cross — 4 small stars */}
      <Star cx={75} cy={20} r={3.5} fill="#FFFFFF" />
      <Star cx={85} cy={42} r={3.5} fill="#FFFFFF" />
      <Star cx={70} cy={58} r={3.5} fill="#FFFFFF" />
      <Star cx={82} cy={72} r={3.5} fill="#FFFFFF" />
      <Star cx={78} cy={84} r={2.5} fill="#FFFFFF" />
    </>
  );
}

function NewZealandFlag() {
  return (
    <>
      <rect x="0" y="0" width="100" height="100" fill="#00247D" />
      <UnionJackCanton x={0} y={0} w={50} h={50} />
      {/* Southern Cross stars (red w/ white border) */}
      <Star cx={70} cy={28} r={4} fill="#CC142B" stroke="#FFFFFF" />
      <Star cx={82} cy={50} r={4.5} fill="#CC142B" stroke="#FFFFFF" />
      <Star cx={68} cy={62} r={4} fill="#CC142B" stroke="#FFFFFF" />
      <Star cx={78} cy={78} r={4.2} fill="#CC142B" stroke="#FFFFFF" />
    </>
  );
}

function ScotlandFlag() {
  return (
    <>
      <rect x="0" y="0" width="100" height="100" fill="#005EB8" />
      <path d="M0 0 L100 100 M100 0 L0 100" stroke="#FFFFFF" strokeWidth="14" />
    </>
  );
}

function JordanFlag() {
  return (
    <>
      <rect x="0" y="0" width="100" height="33.5" fill="#000000" />
      <rect x="0" y="33" width="100" height="34.5" fill="#FFFFFF" />
      <rect x="0" y="66.5" width="100" height="34" fill="#007A3D" />
      <polygon points="0,0 0,100 50,50" fill="#CE1126" />
      <Star cx={20} cy={50} r={5} fill="#FFFFFF" />
    </>
  );
}

function UsaFlag() {
  // 13 stripes + canton with 50 stars (we draw a 5x6 grid simplified).
  const stripes = Array.from({ length: 13 }).map((_, i) => (
    <rect
      key={i}
      x="0"
      y={(100 / 13) * i}
      width="100"
      height={100 / 13 + 0.5}
      fill={i % 2 === 0 ? "#B22234" : "#FFFFFF"}
    />
  ));
  const stars: React.ReactElement[] = [];
  // 5 rows of 6 stars (approximation of 50)
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 6; c++) {
      stars.push(
        <Star
          key={`s-${r}-${c}`}
          cx={3 + c * 6.8}
          cy={4 + r * 5.4}
          r={1.6}
          fill="#FFFFFF"
        />,
      );
    }
  }
  return (
    <>
      {stripes}
      <rect x="0" y="0" width="44" height="29" fill="#3C3B6E" />
      {stars}
    </>
  );
}

function CanadaFlag() {
  return (
    <>
      <rect x="0" y="0" width="25" height="100" fill="#D52B1E" />
      <rect x="25" y="0" width="50" height="100" fill="#FFFFFF" />
      <rect x="75" y="0" width="25" height="100" fill="#D52B1E" />
      {/* Simplified maple leaf */}
      <path
        d="M50 20 L54 36 L68 32 L60 44 L74 50 L60 56 L68 68 L54 64 L50 80 L46 64 L32 68 L40 56 L26 50 L40 44 L32 32 L46 36 Z"
        fill="#D52B1E"
      />
    </>
  );
}

function MexicoFlag() {
  return (
    <>
      <rect x="0" y="0" width="33.5" height="100" fill="#006847" />
      <rect x="33" y="0" width="34" height="100" fill="#FFFFFF" />
      <rect x="66.5" y="0" width="33.5" height="100" fill="#CE1126" />
      {/* Eagle simplified as a small disc + olive ring */}
      <ellipse cx="50" cy="50" rx="11" ry="8" fill="#7A4F1B" />
      <circle cx="50" cy="50" r="11" fill="none" stroke="#7A4F1B" strokeWidth="1.4" />
    </>
  );
}

function EnglandFlag() {
  return (
    <>
      <rect x="0" y="0" width="100" height="100" fill="#FFFFFF" />
      <rect x="42" y="0" width="16" height="100" fill="#CF142B" />
      <rect x="0" y="42" width="100" height="16" fill="#CF142B" />
    </>
  );
}

function SwissFlag() {
  return (
    <>
      <rect x="0" y="0" width="100" height="100" fill="#D52B1E" />
      <rect x="42" y="20" width="16" height="60" fill="#FFFFFF" />
      <rect x="20" y="42" width="60" height="16" fill="#FFFFFF" />
    </>
  );
}

function TurkeyFlag() {
  return (
    <>
      <rect x="0" y="0" width="100" height="100" fill="#E30A17" />
      {/* crescent */}
      <circle cx="40" cy="50" r="18" fill="#FFFFFF" />
      <circle cx="44" cy="50" r="14" fill="#E30A17" />
      <Star cx={62} cy={50} r={6} fill="#FFFFFF" />
    </>
  );
}

function PortugalFlag() {
  return (
    <>
      <rect x="0" y="0" width="40" height="100" fill="#046A38" />
      <rect x="40" y="0" width="60" height="100" fill="#DA291C" />
      <circle cx="40" cy="50" r="13" fill="#FFE600" stroke="#000000" strokeWidth="0.8" />
      <circle cx="40" cy="50" r="8" fill="#FFFFFF" stroke="#000000" strokeWidth="0.6" />
    </>
  );
}

function SpainFlag() {
  return (
    <>
      <rect x="0" y="0" width="100" height="25" fill="#AA151B" />
      <rect x="0" y="25" width="100" height="50" fill="#F1BF00" />
      <rect x="0" y="75" width="100" height="25" fill="#AA151B" />
      {/* Small crest placeholder on hoist side */}
      <rect x="22" y="40" width="14" height="20" fill="#AA151B" rx="1" />
      <rect x="24" y="42" width="10" height="16" fill="#F1BF00" />
    </>
  );
}

/* ---------- Helpers ---------- */

function Star({
  cx,
  cy,
  r,
  fill,
  stroke,
}: {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  stroke?: string;
}) {
  // 5-point star using polar coords
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return (
    <polygon
      points={points.join(" ")}
      fill={fill}
      stroke={stroke}
      strokeWidth={stroke ? 0.6 : undefined}
    />
  );
}
