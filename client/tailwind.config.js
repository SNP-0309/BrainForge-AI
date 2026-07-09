/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#FFFDF6', // Light Brutalist Cream
        foreground: '#000000', // Pure Black Text
        card: {
          DEFAULT: '#FFFFFF', // Clean White Cards
          hover: '#FAF8F0',
        },
        border: '#000000', // Black Borders
        primary: {
          DEFAULT: '#FFE600', // Saturated Yellow
          hover: '#E6CE00',
        },
        accent: {
          DEFAULT: '#4ADE80', // Saturated Green
          hover: '#22C55E',
        },
        muted: '#4B5563', // Charcoal Muted
        brutal: {
          cream: '#FFFDF6',
          yellow: '#FFE600',
          green: '#4ADE80',
          purple: '#E9D5FF',
          pink: '#FFAED7',
          blue: '#60A5FA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '4px',
      },
      boxShadow: {
        brutal: '4px 4px 0px 0px #000000',
        'brutal-lg': '7px 7px 0px 0px #000000',
      },
    },
  },
  plugins: [],
}
