/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          900: 'var(--surface-900)',
          850: 'var(--surface-850)',
          800: 'var(--surface-800)',
          750: 'var(--surface-750)',
          700: 'var(--surface-700)',
          650: 'var(--surface-650)',
          600: 'var(--surface-600)',
        },
        ink: {
          100: 'var(--ink-100)',
          200: 'var(--ink-200)',
          300: 'var(--ink-300)',
          400: 'var(--ink-400)',
          500: 'var(--ink-500)',
          600: 'var(--ink-600)',
        },
        accent: {
          100: 'var(--accent-100)',
          300: 'var(--accent-300)',
          400: 'var(--accent-400)',
          500: 'var(--accent-500)',
          600: 'var(--accent-600)',
          700: 'var(--accent-700)',
          DEFAULT: 'var(--accent-500)',
        },
        chrome: {
          line: 'var(--chrome-line)',
          'line-2': 'var(--chrome-line-2)',
          'line-3': 'var(--chrome-line-3)',
        },
        signal: {
          warn: 'var(--warn)',
          err: 'var(--err)',
          info: 'var(--electric-500)',
        },
      },
      fontFamily: {
        sans: ['Inter Tight', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Geist', 'Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', '"JetBrains Mono"', 'ui-monospace', 'Menlo', 'Monaco', 'monospace'],
      },
      fontSize: {
        micro: ['0.6875rem', { lineHeight: '1.2' }],
        xs: ['0.75rem', { lineHeight: '1.25' }],
        sm: ['0.8125rem', { lineHeight: '1.4' }],
        base: ['0.875rem', { lineHeight: '1.5' }],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.18)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.24), 0 1px 2px 0 rgba(0, 0, 0, 0.18)',
        'panel': '0 24px 56px -16px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(232, 218, 196, 0.04)',
        'inner-soft': 'inset 0 1px 0 rgba(255, 248, 232, 0.04)',
        'glow-accent': '0 0 24px rgba(220, 181, 120, 0.18)',
        'none': 'none',
      },
      transitionDuration: {
        '140': '140ms',
        '240': '240ms',
        '380': '380ms',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.32, 0.64, 1)',
        'soft': 'cubic-bezier(0.4, 0.05, 0.2, 1)',
        'out-quint': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      animation: {
        'fade-in': 'fade-in 0.32s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'fade-in-up': 'fade-in-up 0.42s cubic-bezier(0.34, 1.32, 0.64, 1) forwards',
        'slide-in': 'slide-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-4px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      borderRadius: {
        DEFAULT: '10px',
        none: '0',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        pill: '9999px',
      },
    },
  },
  plugins: []
}
