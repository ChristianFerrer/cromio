import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          50: "#F1FAF4",
          100: "#E6F4EC",
          500: "#1FAE5A",
          700: "#117C4E",
          900: "#0B6E3F",
        },
        ink: {
          DEFAULT: "#0E0E0E",
          soft: "#1A1A1A",
        },
        charcoal: "#3A3A3A",
        gold: {
          DEFAULT: "#D4AF37",
          light: "#F0DA8E",
          dark: "#8C7220",
        },
        bone: "#FAFAF7",
        paper: "#F5F4EE",
        line: {
          DEFAULT: "#E8E6DE",
          strong: "#D8D5C9",
        },
        mute: "#6B6858",
        text: {
          DEFAULT: "#1A1A1A",
          2: "#5C5A50",
        },
        wc: {
          mx: "#E5006D",
          us: "#1E5FBF",
          ca: "#E63946",
        },
        match: {
          green: "#5BE491",
          red: "#FF6B7A",
          interest: "#2D7DD8",
        },
        trade: {
          // Used for ▲ entregas (give) markers on banners and arrows.
          give: "#D7263D",
          get: "#117C4E",
        },
      },
      fontFamily: {
        display: ["var(--font-bebas)", "Oswald", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "-apple-system", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xs: "6px",
        sm: "10px",
        md: "14px",
        lg: "20px",
        xl: "28px",
        card: "12px",
      },
      boxShadow: {
        sh1: "0 1px 2px rgba(11,28,18,.06), 0 2px 6px rgba(11,28,18,.04)",
        sh2: "0 4px 14px rgba(11,28,18,.08), 0 1px 3px rgba(11,28,18,.05)",
        sh3: "0 10px 30px rgba(11,28,18,.12), 0 4px 10px rgba(11,28,18,.06)",
        gold: "0 8px 24px rgba(212,175,55,.35), 0 2px 6px rgba(212,175,55,.25)",
      },
      keyframes: {
        "radar-spin": { to: { transform: "rotate(360deg)" } },
        "radar-pulse": {
          "0%": { transform: "scale(.05)", opacity: ".85" },
          "80%": { opacity: ".15" },
          "100%": { transform: "scale(1)", opacity: "0" },
        },
        "slide-down": {
          from: { transform: "translateY(-12px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "holo-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
      animation: {
        "radar-spin": "radar-spin 3.6s linear infinite",
        "radar-pulse": "radar-pulse 2.6s ease-out infinite",
        "slide-down": "slide-down .25s ease",
        "holo-shift": "holo-shift 4.5s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
