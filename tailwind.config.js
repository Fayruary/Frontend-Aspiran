/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F5F2EC",
        dark:  "#1C1C1C",
        gold:  "#D4A843",
        muted: "#6B6760",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["DM Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};