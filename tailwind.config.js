/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          blue: '#00f2ff',
          purple: '#7000ff',
          green: '#33ff00',
        },
        bg: {
          dark: '#050505',
          console: '#0a0a0a',
          circuit: '#050505',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Noto Sans JP', 'sans-serif'],
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
