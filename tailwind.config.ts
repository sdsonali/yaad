import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f6f1e7",
        ink: "#1e1a16",
        muted: "#6f655c",
        line: "#e3d8c8",
        terracotta: "#b94b2a",
        clay: "#f8e6dc",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "var(--font-deva)", "sans-serif"],
        display: ["var(--font-display)", "serif"],
      },
      boxShadow: {
        bar: "0 8px 30px rgba(60, 40, 20, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
