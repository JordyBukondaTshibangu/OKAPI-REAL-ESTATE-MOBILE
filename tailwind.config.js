/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ── Light palette ───────────────────────────────────────────
        primary: "#1E63B5",
        "primary-hover": "#174E90",
        navy: "#0B1D3A",
        secondary: "#D4AF37",
        background: "#FFFFFF",
        "background-alt": "#F2F4F7",
        foreground: "#1A1F2B",
        "muted-fg": "#64748B",
        border: "#E2E8F0",
        accent: "#EAF2FB",
        destructive: "#DC2626",
        card: "#FFFFFF",
        "text-dark": "#1A1F2B",
        "text-light": "#6B7A99",

        // ── Dark palette ────────────────────────────────────────────
        // Maps to web .dark {} CSS variable overrides (HSL → hex)
        dark: {
          background: "#0B1829",      // hsl(217 68% 10%)
          "background-alt": "#112234", // hsl(217 60% 14%)
          foreground: "#F2F2F2",       // hsl(0 0% 95%)
          primary: "#5BA5E8",          // hsl(214 72% 60%)
          "primary-hover": "#7EBCEE", // hsl(214 72% 70%)
          secondary: "#D4B84A",        // hsl(46 65% 58%)
          navy: "#081527",             // hsl(217 70% 8%)
          muted: "#1A2E47",            // hsl(217 50% 18%)
          "muted-fg": "#8596B0",       // hsl(215 20% 60%)
          border: "#2B3F5C",           // hsl(217 33% 25%)
          card: "#112234",             // hsl(217 60% 14%)
          "card-fg": "#F2F2F2",        // hsl(0 0% 95%)
          accent: "#1A3353",           // hsl(214 50% 20%)
          "accent-fg": "#7EBCEE",      // hsl(214 72% 70%)
          destructive: "#E05555",      // hsl(0 72% 60%)
        },
      },
      fontFamily: {
        sans: ["DMSans_400Regular", "sans-serif"],
        "sans-medium": ["DMSans_500Medium", "sans-serif"],
        "sans-semibold": ["DMSans_600SemiBold", "sans-serif"],
        "sans-bold": ["DMSans_700Bold", "sans-serif"],
      },
    },
  },
  plugins: [],
};
