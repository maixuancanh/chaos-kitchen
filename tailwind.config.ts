import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kitchen: {
          bg: "#1a0a00",
          surface: "#2d1500",
          accent: "#ff6b00",
          danger: "#ff1a00",
          success: "#00cc44",
          chaos: "#9b00ff",
        },
      },
      fontFamily: {
        display: ["'Bangers'", "cursive"],
        body: ["'Nunito'", "sans-serif"],
      },
      animation: {
        "shake": "shake 0.5s cubic-bezier(.36,.07,.19,.97) both",
        "fire-flicker": "fireFlicker 0.3s infinite alternate",
        "smoke-rise": "smokeRise 2s ease-out infinite",
        "chaos-pulse": "chaosPulse 1s ease-in-out infinite",
        "slide-in": "slideIn 0.4s ease-out",
        "bounce-in": "bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
      keyframes: {
        shake: {
          "10%, 90%": { transform: "translate3d(-1px, 0, 0)" },
          "20%, 80%": { transform: "translate3d(2px, 0, 0)" },
          "30%, 50%, 70%": { transform: "translate3d(-4px, 0, 0)" },
          "40%, 60%": { transform: "translate3d(4px, 0, 0)" },
        },
        fireFlicker: {
          "0%": { opacity: "0.8", transform: "scaleY(1)" },
          "100%": { opacity: "1", transform: "scaleY(1.05)" },
        },
        smokeRise: {
          "0%": { opacity: "0.6", transform: "translateY(0) scaleX(1)" },
          "100%": { opacity: "0", transform: "translateY(-60px) scaleX(1.8)" },
        },
        chaosPulse: {
          "0%, 100%": { boxShadow: "0 0 10px #9b00ff" },
          "50%": { boxShadow: "0 0 30px #9b00ff, 0 0 60px #ff00ff" },
        },
        slideIn: {
          from: { transform: "translateX(-100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        bounceIn: {
          from: { transform: "scale(0)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
