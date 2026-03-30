/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#ede8d8',
          surface: '#ffffff',
        },
        border: {
          base: '#d2d2d7',
        },
        accent: {
          purple: '#8b5cf6',
          blue: '#0071e3',
          lavender: '#6e6e73',
        },
      },
    },
  },
  plugins: [],
};
