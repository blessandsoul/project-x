/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'float-slow': 'float-slow 20s ease-in-out infinite',
        'float-slower': 'float-slower 25s ease-in-out infinite',
        'float-medium': 'float-medium 18s ease-in-out infinite',
        'scroll-vertical': 'scroll-vertical 30s linear infinite',
      },
      keyframes: {
        'scroll-vertical': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-33.333%)' },
        },
      },
    },
  },
}
