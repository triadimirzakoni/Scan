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
          DEFAULT: "#0A1020",
          soft: "#0F1830",
          panel: "#16213D",
          line: "#26365C",
        },
        paper: {
          DEFAULT: "#E3EAF8",
          bright: "#F5F8FF",
          dim: "#A6B4D4",
        },
        scan: {
          DEFAULT: "#5B9CFF",
          dim: "#3B73D6",
          glow: "#8CC0FF",
        },
        amber: {
          DEFAULT: "#E8A33D",
        },
      },
      fontFamily: {
        display: ["var(--font-jakarta)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        // dulu monospace ala "readout"; sekarang pakai font body biar lebih modern
        mono: ["var(--font-inter)", "sans-serif"],
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        pop: {
          "0%": { opacity: "0", transform: "translateY(12px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        bob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      boxShadow: {
        soft: "0 8px 30px -12px rgba(8, 16, 40, 0.7)",
        glow: "0 8px 24px -8px rgba(91, 156, 255, 0.55)",
      },
      animation: {
        pop: "pop 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
        scanline: "scanline 2.4s linear infinite",
        bob: "bob 3.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
