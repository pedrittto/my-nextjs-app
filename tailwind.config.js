/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBlack: '#000000',
        darkSection: '#121212',
        darkCard: '#1a1a1a',
      },
    },
  },
  plugins: [require("@tailwindcss/line-clamp")],
}; 