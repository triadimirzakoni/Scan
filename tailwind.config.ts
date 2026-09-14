import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#14181C",
          soft: "#1B2027",
          panel: "#2A2F36",
          line: "#3A414A",
        },
        paper: {
          DEFAULT: "#EFE9DA",
          bright: "#F8F4EA",
          dim: "#DCD4BF",
        },
        scan: {
          DEFAULT: "#6EE7B0",
          dim: "#3E9B75",
        },
        amber: {
          DEFAULT: "#E8A33D",
        },
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        bob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        scanline: "scanline 2.4s linear infinite",
        bob: "bob 3.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
