import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "ink" now doubles as the noir accent (his color) — kept the
        // token name so components didn't need renaming everywhere.
        ink: {
          DEFAULT: "#1A1A1A",
          light: "#2E2E2E",
          dark: "#0A0A0A",
        },
        paper: {
          DEFAULT: "#FFFBF9",
          dim: "#F6EEF3",
        },
        // her color — soft lilac-pink, used as the main warm accent
        mustard: {
          DEFAULT: "#C98FB0",
          dark: "#A8698F",
        },
        // primary CTA accent — deeper rose
        coral: {
          DEFAULT: "#D6779A",
          dark: "#B85A7E",
        },
        // "visited" status accent — muted plum, keeps the pink/lilac/black family
        sage: {
          DEFAULT: "#8C7AA6",
          dark: "#6B5C82",
        },
        blossom: "#F7E3ED",
        lilac: "#E9DFF5",
        charcoal: "#2B2530",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 1px 1px, rgba(20,51,46,0.06) 1px, transparent 0)",
      },
      backgroundSize: {
        grain: "18px 18px",
      },
    },
  },
  plugins: [],
};
export default config;
