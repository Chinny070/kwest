/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Kwest brand — dark amber/gold + deep slate
        brand: {
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        slate: {
          850: "#1a2233",
          950: "#0a0f1e",
        },
      },
      fontFamily: {
        display: ["var(--font-clash)", "system-ui", "sans-serif"],
        body:    ["var(--font-satoshi)", "system-ui", "sans-serif"],
        mono:    ["var(--font-jetbrains)", "monospace"],
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(rgba(251,191,36,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.05) 1px, transparent 1px)",
        "hero-glow":    "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(251,191,36,0.15) 0%, transparent 70%)",
        "card-glow":    "radial-gradient(ellipse 100% 100% at 50% 0%, rgba(251,191,36,0.06) 0%, transparent 70%)",
      },
      backgroundSize: {
        "grid": "40px 40px",
      },
      animation: {
        "pulse-slow":     "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float":          "float 6s ease-in-out infinite",
        "shimmer":        "shimmer 2s linear infinite",
        "fade-in":        "fadeIn 0.5s ease-out",
        "slide-up":       "slideUp 0.4s ease-out",
        "glow":           "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glow: {
          "0%":   { boxShadow: "0 0 20px rgba(251,191,36,0.2)" },
          "100%": { boxShadow: "0 0 40px rgba(251,191,36,0.4)" },
        },
      },
      boxShadow: {
        "brand":       "0 0 0 1px rgba(251,191,36,0.2), 0 4px 24px rgba(251,191,36,0.1)",
        "brand-lg":    "0 0 0 1px rgba(251,191,36,0.3), 0 8px 40px rgba(251,191,36,0.2)",
        "card":        "0 1px 3px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)",
        "card-hover":  "0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(251,191,36,0.15)",
      },
    },
  },
  plugins: [],
};
