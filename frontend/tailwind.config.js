/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gardenGreen: '#3b8d4a',
        gardenSky: '#8ecae6',
        gardenSoil: '#7b5e57',
      },
    },
  },
  plugins: [],
};
