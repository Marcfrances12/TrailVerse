module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        bosque: {
          950: '#0d2818',
          900: '#14332a',
          800: '#1b4332',
          700: '#2d6a4f',
          600: '#40916c',
          500: '#52b788',
          400: '#74c69d',
          300: '#95d5b2',
          100: '#d8f3dc',
        },
        crema: {
          50: '#faf8f2',
          100: '#f4f1e6',
          200: '#e9e4d3',
          300: '#dcd5be',
        },
        tierra: {
          500: '#a97142',
          600: '#8b5e34',
          700: '#6f4a27',
        },
        tinta: '#1f2a24',
        'tinta-suave': '#55635b',
      },
      fontFamily: {
        display: ['"Trebuchet MS"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
