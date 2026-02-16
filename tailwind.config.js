/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: '#FFFFFF',
          light: '#F9FAFB',
          border: '#E5E7EB',
        },
        ghost: {
          DEFAULT: '#111827',
          bright: '#374151',
          muted: '#4B5563', // Darkened from #6B7280 for better contrast
          dim: '#9CA3AF',
        },
        accent: {
          DEFAULT: '#000000',
          dim: '#333333',
          glow: 'transparent',
        },
        signal: {
          success: '#059669',
          warning: '#D97706',
          error: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Menlo', 'Monaco', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.25' }],
        sm: ['0.8125rem', { lineHeight: '1.4' }],
        base: ['0.875rem', { lineHeight: '1.5' }],
        micro: ['0.6875rem', { lineHeight: '1.2' }],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'none': 'none',
      },
      transitionDuration: {
        '250': '250ms',
        '300': '300ms',
      },
      animation: {
        'typing': 'typing-cursor 1s step-end infinite',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'bounce-short': 'bounce-short 0.5s ease-in-out 1',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,255,255,0.4))',
      },
      keyframes: {
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'bounce-short': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-25%)' },
        },
        'typing-cursor': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        DEFAULT: '12px', // Standardized to 12px for main containers
        none: '0',
        sm: '6px',       // Slightly larger small radius
        md: '8px',
        lg: '12px',      // Matches default
        xl: '16px',      // Larger for outer shells
        pill: '9999px',
      },
    },
  },
  plugins: []
}
