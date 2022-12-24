/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/*/*.ejs",
    "./views/*.ejs"
  ],
  theme: {
    extend: {
      fontFamily: {
        "DM-sans": ['DM Sans', ' sans-serif'],
        "Nunito": ['Nunito', 'sans-serif'],
        "Kaushan": ['Kaushan Script', 'cursive'],
      },
      colors: {
        'primary': '#1abc9c',
        'secondary': '#f8f8f8',
        'staticPri': '#777'
      },
      screens: {
        'mobile': '930px'
      }
    },
  },
  plugins: [],
}
