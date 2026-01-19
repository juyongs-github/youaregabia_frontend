/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0f0f0f',
          surface: '#181818',
        },
        border: {
          base: '#2a2a2a',
        },
        accent: {
          purple: '#8b5cf6',
          blue: '#3b82f6',
          lavender: '#a78bfa',
        },
      },
    },
  },
  plugins: [],
};
