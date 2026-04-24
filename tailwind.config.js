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
          DEFAULT: '#000000',
          light: '#050505',
          border: 'rgba(255,255,255,0.03)',
        },
        surface: {
          primary: 'rgba(10, 10, 12, 0.4)',
          elevated: 'rgba(20, 20, 24, 0.6)',
          overlay: 'rgba(255,255,255,0.01)',
          glass: 'rgba(255,255,255,0.03)',
        },
        ghost: {
          DEFAULT: '#ffffff',
          bright: '#ffffff',
          muted: '#a1a1aa',
          dim: '#52525b',
        },
        accent: {
          DEFAULT: '#4f46e5', // Indigo-600
          dim: '#4338ca',
          glow: 'rgba(79,70,229,0.3)',
          subtle: 'rgba(79,70,229,0.1)',
        },
        signal: {
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Geist Mono', 'Menlo', 'Monaco', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.25' }],
        sm: ['0.8125rem', { lineHeight: '1.4' }],
        base: ['0.875rem', { lineHeight: '1.5' }],
        micro: ['0.6875rem', { lineHeight: '1.2' }],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'glow-subtle': '0 0 15px rgba(79,70,229,0.15)',
        'glow': '0 0 30px rgba(79,70,229,0.3)',
        'glow-strong': '0 0 50px rgba(79,70,229,0.5)',
        'inner-light': 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0px 0px 20px rgba(255,255,255,0.02)',
        'inner-light-strong': 'inset 0 1px 0 rgba(255,255,255,0.15)',
        'panel': '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.05)',
        'none': 'none',
      },
      transitionDuration: {
        '250': '250ms',
        '300': '300ms',
        '500': '500ms',
      },
      animation: {
        'typing': 'typing-cursor 1s step-end infinite',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-down': 'fade-in-down 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'shimmer-slow': 'shimmer 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'aurora': 'aurora 15s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'stream-bar': 'stream-bar 1.5s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'cta-breathe': 'cta-breathe 2.5s ease-in-out infinite',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(to bottom, rgba(255,255,255,0.06), rgba(255,255,255,0.01))',
        'accent-gradient': 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)',
        'accent-gradient-hover': 'linear-gradient(135deg, #4338ca 0%, #9333ea 100%)',
        'canvas-grid': 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
        'canvas-mesh': 'linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '20px 20px',
        'mesh': '32px 32px',
        'aurora': '300% 300%',
      },
      keyframes: {
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
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
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 15px rgba(79,70,229,0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(79,70,229,0.5)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-4px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'stream-bar': {
          '0%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'aurora': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'cta-breathe': {
          '0%, 100%': { boxShadow: '0 0 30px rgba(79,70,229,0.4), 0 0 60px rgba(79,70,229,0.15)' },
          '50%': { boxShadow: '0 0 50px rgba(79,70,229,0.6), 0 0 100px rgba(79,70,229,0.25)' },
        }
      },
      borderRadius: {
        DEFAULT: '12px',
        none: '0',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '32px',
        pill: '9999px',
      },
    },
  },
  plugins: []
}
