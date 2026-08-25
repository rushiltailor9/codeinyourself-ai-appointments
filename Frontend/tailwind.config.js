/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#070B14',
          900: '#0B1220',
          800: '#111A2E',
          700: '#182642',
          600: '#22335A',
          500: '#334572',
        },
        signal: {
          DEFAULT: '#5CF2A3',
          dim: '#2FA876',
          soft: '#8FFFC4',
        },
        paper: '#EDF1F7',
        muted: '#8493B0',
        amber: { DEFAULT: '#F2B15C' },
        coral: { DEFAULT: '#F26C6C' },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '28px 28px',
      },
    },
  },
  plugins: [],
}
