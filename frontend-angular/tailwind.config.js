/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        sage: "#7b9f86",
        cream: "#f8fbf7",
        mint: "#e0f0e6",
        forest: "#18382e",
        clay: "#b89a8a",
        'soft-sage': "#8da693",
        'warm-cream': "#faf7f2",
        'gentle-mint': "#e8f3ee",
        'deep-forest': "#2d3b32",
        primary: "#5a9270",
        'primary-dark': "#4a7d5e",
        danger: "#ef4444",
        warning: "#f59e0b",
        info: "#3b82f6",
        'amber-light': '#fef3c7',
      },
      fontFamily: {
        sans: ["'Inter'", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "Helvetica", "Arial", "sans-serif"],
        heading: ["'Nunito'", "'Inter'", "sans-serif"],
        serif: ["'Instrument Serif'", "serif"],
      },
    },
  },
  plugins: [],
}
