/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#8b5cf6",
        "secondary": "#ec4899",
        "background-light": "#ffffff",
        "background-dark": "#101922",
        "surface-light": "#f8f9fa",
        "surface-dark": "#1c2630",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"]
      },
      borderRadius: { 
        "DEFAULT": "0.25rem", 
        "lg": "0.5rem", 
        "xl": "0.75rem", 
        "full": "9999px" 
      },
    },
  },
  plugins: [],
}