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
        primary: {
          50: '#f5f3ff', // Lilac 50
          100: '#ede9fe', // Lilac 100
          200: '#ddd6fe', // Lilac 200
          300: '#c4b5fd', // Lilac 300
          400: '#a78bfa', // Lilac 400
          500: '#8b5cf6', // Lilac 500
          600: '#7c3aed', // Lilac 600
          700: '#6d28d9', // Lilac 700
          800: '#5b21b6', // Lilac 800
          900: '#4c1d95', // Lilac 900
          950: '#2e1065', // Lilac 950
        },
        secondary: {
          50: '#eff6ff', // Blue 50
          100: '#dbeafe', // Blue 100
          200: '#bfdbfe', // Blue 200
          300: '#93c5fd', // Blue 300
          400: '#60a5fa', // Blue 400
          500: '#3b82f6', // Blue 500
          600: '#2563eb', // Blue 600
          700: '#1d4ed8', // Blue 700
          800: '#1e40af', // Blue 800
          900: '#1e3a8a', // Blue 900
          950: '#172554', // Blue 950
        },
        accent: {
          500: '#10b981', // Green 500 (Success)
          600: '#059669', // Green 600
        },
        slate: {
          850: '#1e293b', // Subtle black
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
