import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nostrum tokens (NOSTRUM-DESIGN.md §3). Black canvas, gold light, green reserved.
        nostrum: {
          black: "#050505",
          "near-black": "#090909",
          charcoal: "#111111",
          grey: "#1a1a1a",
          white: "#f5f5f3",
          "soft-grey": "#8a8a8a",
          gold: "#e6b45a",
          amber: "#ff8a3d",
          green: "#9bd64a", // footer wordmark ONLY
          paper: "#f4f4f2",
          ink: "#0e1a26",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
