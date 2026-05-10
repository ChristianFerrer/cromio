/**
 * Single source of truth for hex values that can't use Tailwind classes
 * (Leaflet divIcon HTML strings, inline `style={}` for dynamic colors,
 * etc.). Keep in sync with tailwind.config.ts.
 */
export const CROMIO_COLORS = {
  green: {
    50: "#E5FEF0",
    100: "#C0FCDC",
    500: "#01F78B",
    700: "#007A47",
    900: "#00563B",
  },
  teal: {
    50: "#E1F4FA",
    100: "#B5E2EF",
    500: "#0F97BD",
    700: "#0A7393",
    900: "#074F65",
  },
  ink: "#0E0E0E",
  charcoal: "#3A3A3A",
  gold: "#D4AF37",
  goldLight: "#F0DA8E",
  goldDark: "#8C7220",
  bone: "#FAFAF7",
  paper: "#F5F4EE",
  line: "#E8E6DE",
  lineStrong: "#D8D5C9",
  mute: "#6B6858",
  text: "#1A1A1A",
  text2: "#5C5A50",
  match: {
    green: "#5BE491",
    red: "#FF6B7A",
    interest: "#2D7DD8",
  },
  trade: {
    give: "#D7263D",
    get: "#117C4E",
  },
} as const;
