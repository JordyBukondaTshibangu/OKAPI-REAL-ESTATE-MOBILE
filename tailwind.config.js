/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
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
