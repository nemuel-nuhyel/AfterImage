import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#030607",
        ink: "#071012",
        panel: "#0b1318",
        panel2: "#101a21",
        line: "#1d3038",
        line2: "#274651",
        cyan: "#5ee7dc",
        cyan2: "#26cfc2",
        amber: "#ffc453",
        danger: "#ff4f58",
        violet: "#8c8dff",
        leaf: "#72e6a3",
        text: "#eef7f8",
        muted: "#98a9b2",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["SFMono-Regular", "Consolas", "Liberation Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 34px rgba(94, 231, 220, 0.18)",
        panel: "0 24px 80px rgba(0, 0, 0, 0.34)",
        button: "0 16px 44px rgba(38, 207, 194, 0.25)",
      },
    },
  },
  plugins: [],
} satisfies Config;
