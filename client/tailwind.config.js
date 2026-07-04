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
        background: 'rgb(4, 10, 19)', // Deep Dark Slate
        foreground: 'rgb(230, 236, 245)',
        card: {
          DEFAULT: 'rgb(9, 17, 32)', // Card base
          hover: 'rgb(14, 25, 47)',
        },
        border: 'rgba(255, 255, 255, 0.08)',
        primary: {
          DEFAULT: '#059669', // Emerald Green
          hover: '#047857',
        },
        accent: {
          DEFAULT: '#6366f1', // Indigo accents
          hover: '#4f46e5',
        },
        muted: '#94a3b8', // Slate Gray
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
        premium: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
    },
  },
  plugins: [],
}
