/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ui: {
          bg: '#060b12',
          surface: '#0f1724',
          'surface-2': '#162234',
          border: '#27374f',
          text: '#e5edf8',
          muted: '#8ea2bd',
          primary: '#5ca6ff',
          accent: '#f0a93e',
          success: '#41c48a',
          danger: '#e56b6f',
        },
      },
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
      },
      borderRadius: {
        'ui-sm': '0.375rem',
        'ui-md': '0.625rem',
        'ui-lg': '0.875rem',
        'ui-xl': '1rem',
      },
      boxShadow: {
        'ui-soft': '0 8px 24px rgba(5, 10, 20, 0.18)',
        'ui-panel': '0 14px 40px rgba(4, 9, 18, 0.42)',
        'ui-glow-accent': '0 0 0 1px rgba(240, 169, 62, 0.3), 0 0 18px rgba(240, 169, 62, 0.15)',
      },
    },
  },
  plugins: [],
}
