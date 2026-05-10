/**
 * Single source of truth for hex values that can't use Tailwind classes
 * (Leaflet divIcon HTML strings, inline `style={}` for dynamic colors,
 * etc.). Keep in sync with tailwind.config.ts.
 */
export const CROMIO_COLORS = {
  green: {
    50: "#F1FAF4",
    100: "#E6F4EC",
    500: "#1FAE5A",
    700: "#117C4E",
    900: "#0B6E3F",
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
