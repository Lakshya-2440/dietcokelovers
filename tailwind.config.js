/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
    },
    extend: {
      colors: {
        background: "#F3F0E7",
        foreground: "#2A2529",
        charcoal: "#2A2529",
        paleivory: "#F3F0E7",
        accent: {
          DEFAULT: "#2A2529",
          muted: "#2A2529cc", // slightly opaque Charcoal
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Merriweather", "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        paper: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)",
        "paper-hover":
          "0 4px 6px rgba(0,0,0,0.1), 0 10px 24px rgba(0,0,0,0.08)",
        "paper-deep":
          "0 10px 30px rgba(0,0,0,0.1), 0 20px 40px rgba(0,0,0,0.1)",
      },
    },
  },
  plugins: [],
}
