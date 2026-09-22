/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#0066ff',
          600: '#0052cc',
          700: '#003d99',
          900: '#0a192f',
        },
        framer: {
          purple: '#914bf1',
          dark: '#101112',
          surface: '#272829',
          light: '#faf7f3',
          border: '#d9d9d9',
          card: '#1e1f20',
          accent: '#b26bf6',
        },
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
