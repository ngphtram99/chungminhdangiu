import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
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
          DEFAULT: "rgb(var(--color-ink) / <alpha-value>)",
          light: "rgb(var(--color-ink-light) / <alpha-value>)",
          dark: "rgb(var(--color-ink-dark) / <alpha-value>)",
        },
        paper: {
          DEFAULT: "rgb(var(--color-paper) / <alpha-value>)",
          dim: "rgb(var(--color-paper-dim) / <alpha-value>)",
        },
        // her color — soft lilac-pink, used as the main warm accent
        mustard: {
          DEFAULT: "rgb(var(--color-mustard) / <alpha-value>)",
          dark: "rgb(var(--color-mustard-dark) / <alpha-value>)",
        },
        // primary CTA accent — deeper rose
        coral: {
          DEFAULT: "rgb(var(--color-coral) / <alpha-value>)",
          dark: "rgb(var(--color-coral-dark) / <alpha-value>)",
        },
        // "visited" status accent — muted plum, keeps the pink/lilac/black family
        sage: {
          DEFAULT: "rgb(var(--color-sage) / <alpha-value>)",
          dark: "rgb(var(--color-sage-dark) / <alpha-value>)",
        },
        blossom: "rgb(var(--color-blossom) / <alpha-value>)",
        lilac: "rgb(var(--color-lilac) / <alpha-value>)",
        charcoal: "rgb(var(--color-charcoal) / <alpha-value>)",
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
