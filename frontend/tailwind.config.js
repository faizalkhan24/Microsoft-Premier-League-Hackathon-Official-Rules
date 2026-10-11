/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pl: {
          purple: '#38003c',
          pink: '#e90052',
          cyan: '#00ff85',
          green: '#04f404',
          yellow: '#ebff00',
          dark: '#120015',
          card: '#1f0724',
          border: '#3c1843'
        }
      }
    },
  },
  plugins: [],
}
