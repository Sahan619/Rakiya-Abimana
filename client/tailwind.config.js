/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff5f0",
          100: "#dce9df",
          200: "#bdd4c3",
          300: "#91b59d",
          400: "#689676",
          500: "#3d8051",
          600: "#2c6842",
          700: "#174b35",
          800: "#123d2c",
          900: "#0d3022"
        },
        accent: {
          50: "#fbf7ef",
          100: "#f2e7d2",
          500: "#d5ad63",
          600: "#bd9145",
          700: "#9b7131"
        }
      }
    },
  },
  plugins: [],
}
