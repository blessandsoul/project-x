/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        salmon: {
          50: "#fff5f3",
          100: "#ffe8e3",
          200: "#ffd5cc",
          300: "#ffb8a8",
          400: "#ff8f74",
          500: "#fa7052",
          600: "#e8542f",
          700: "#c44325",
          800: "#a23b22",
          900: "#863624",
          950: "#49190e",
        },
      },
      animation: {
        "float-slow": "float-slow 20s ease-in-out infinite",
        "float-slower": "float-slower 25s ease-in-out infinite",
        "float-medium": "float-medium 18s ease-in-out infinite",
        "scroll-vertical": "scroll-vertical 30s linear infinite",
        "scroll-yoyo": "scroll-yoyo 60s ease-in-out infinite",
      },
      keyframes: {
        "scroll-vertical": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-33.333%)" },
        },
        "scroll-yoyo": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-33.333%)" },
        },
      },
    },
  },
};
