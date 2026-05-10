/**
 * Single source of truth for hex values that can't use Tailwind classes
 * (Leaflet divIcon HTML strings, inline `style={}` for dynamic colors,
 * etc.). Keep in sync with tailwind.config.ts.
 */
export const CROMIO_COLORS = {
  green: {
    50: "#EBFDF2",
    100: "#D5F7E1",
    500: "#10C56A",
    700: "#089258",
    900: "#066B40",
  },
  ink: "#0E0E0E",
  charcoal: "#3A3A3A",
  gold: "#F5C518",
  goldLight: "#FDE68A",
  goldDark: "#A88008",
  bone: "#FAFAF7",
  paper: "#F5F4EE",
  line: "#E8E6DE",
  lineStrong: "#D8D5C9",
  mute: "#6B6858",
  text: "#1A1A1A",
  text2: "#5C5A50",
  match: {
    green: "#3AF080",
    red: "#FF3D5C",
    interest: "#1E78FF",
  },
  trade: {
    give: "#EF1F3C",
    get: "#089258",
  },
  admin: {
    chart: [
      "#10C56A",
      "#089258",
      "#22D65E",
      "#0DA84F",
      "#06B6D4",
      "#1E78FF",
      "#EF1F3C",
    ],
  },
} as const;
