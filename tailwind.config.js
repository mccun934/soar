/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'soar': {
          'dark': '#0a0a0f',
          'darker': '#050508',
          'accent': '#00d4ff',
          'accent-dim': '#0099bb',
          'warning': '#ff9500',
          'error': '#ff3b5c',
          'success': '#00ff88',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
