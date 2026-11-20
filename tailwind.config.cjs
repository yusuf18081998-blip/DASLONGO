/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./js/**/*.js"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        night: "#090b0e",
        panel: "#11141a",
        line: "#282f3c",
        neon: "#ffff00",
        "neon-soft": "#ffff00",
        "neon-amber": "#ffff00",
        lime: "#ffff00",
        sky: "#ffff00",
        fire: "#ffff00"
      },
      boxShadow: {
        neon: "0 0 24px rgba(255, 255, 0, 0.35)",
        "neon-lg": "0 0 40px rgba(255, 255, 0, 0.5)"
      }
    }
  },
  plugins: []
};