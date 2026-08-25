/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#F8FAFC',
          900: '#FFFFFF',
          800: '#F1F5F9',
          700: '#E2E8F0',
          600: '#CBD5E1',
          500: '#94A3B8',
        },
        signal: {
          DEFAULT: '#10B981',
          dim: '#047857',
          soft: '#059669',
        },
        paper: '#0F172A',
        muted: '#64748B',
        amber: { DEFAULT: '#D97706' },
        coral: { DEFAULT: '#EF4444' },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '28px 28px',
      },
    },
  },
  plugins: [],
}
