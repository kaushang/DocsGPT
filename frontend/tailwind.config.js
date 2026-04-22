/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#020617",
        panel: "#0f172a",
        line: "#1e293b",
      },
    },
  },
  plugins: [],
};
