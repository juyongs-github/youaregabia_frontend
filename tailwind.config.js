/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#0f0f0f",
          surface: "#181818",
        },
        border: {
          base: "#2a2a2a",
        },
        accent: {
          purple: "#8b5cf6",
          blue: "#3b82f6",
          lavender: "#a78bfa",
        },
      },
      keyframes: {
        pingOnce: {
          "0%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      // gameCountdown에서 사용
      animation: {
        "ping-once": "pingOnce 0.35s ease-out",
      },
    },
  },
  plugins: [],
};
