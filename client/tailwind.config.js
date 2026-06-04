/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff8f0',
          100: '#ffecd6',
          200: '#ffd4a8',
          300: '#ffb570',
          400: '#ff8c38',
          500: '#f97316',
          600: '#ea6010',
          700: '#c44d0e',
          800: '#9c3d12',
          900: '#7e3412',
        },
      },
    },
  },
  plugins: [],
};
