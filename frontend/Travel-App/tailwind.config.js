/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      sans: ['"Poppins"', 'sans-serif'],
    },
    extend: {
      colors:{
        primary: "#05B6D3",
        secondary: "#EF873E",
      }
    },
  },
  plugins: [],
}

