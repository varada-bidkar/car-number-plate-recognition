/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f8fbff',
          100: '#eef6ff',
          500: '#2563eb',
          700: '#1e40af'
        }
      }
    }
  },
  plugins: [],
}
