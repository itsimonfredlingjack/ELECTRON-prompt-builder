/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Soft Clay / Playful 3D palette */
        void: {
          DEFAULT: '#FFF0F5',
          light: '#FFE8F2',
          border: '#E8D8E6',
          'border-hover': '#DDBFD6',
          'border-bright': '#D1AAC6',
        },
        accent: {
          DEFAULT: '#B28DFF',
          dim: '#9B76EA',
          glow: 'rgba(178, 141, 255, 0.45)',
        },
        candy: {
          mint: '#CFF6DC',
          sky: '#CFE7FF',
          butter: '#FFEFB3',
          peach: '#FFD6C8',
        },
        signal: {
          success: '#56C596',
          warning: '#FFB66E',
          error: '#F08AA6',
        },
        ghost: {
          DEFAULT: '#4C3D5E',
          bright: '#3C2E4D',
          muted: '#705D86',
          dim: '#907FA3',
        },
      },
      fontFamily: {
        sans: ['Nunito', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        display: ['Fredoka', 'Nunito', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        body: ['Nunito', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['Nunito', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.25' }],
        sm: ['0.8125rem', { lineHeight: '1.4' }],
        base: ['0.875rem', { lineHeight: '1.5' }],
        micro: ['0.6875rem', { lineHeight: '1.2' }],
      },
      boxShadow: {
        'glow': '0 0 0 2px rgba(178, 141, 255, 0.24), 0 10px 24px rgba(178, 141, 255, 0.2)',
        'glow-strong': '0 0 0 3px rgba(178, 141, 255, 0.34), 0 14px 30px rgba(178, 141, 255, 0.28)',
        'line': 'inset 0 2px 4px rgba(255,255,255,0.55), inset 0 -3px 6px rgba(180,145,171,0.22), 0 12px 24px rgba(165,130,154,0.22)',
        'clay-sm': 'inset 0 2px 4px rgba(255,255,255,0.55), inset 0 -2px 4px rgba(180,145,171,0.18), 0 8px 16px rgba(165,130,154,0.18)',
      },
      transitionDuration: {
        '250': '250ms',
        '300': '300ms',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-smooth': 'cubic-bezier(0.33, 1, 0.68, 1)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2.5s ease-in-out infinite',
        'typing': 'typing-cursor 1s step-end infinite',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 2px rgba(178, 141, 255, 0.14), 0 8px 16px rgba(178, 141, 255, 0.12)' },
          '50%': { boxShadow: '0 0 0 3px rgba(178, 141, 255, 0.28), 0 14px 28px rgba(178, 141, 255, 0.2)' },
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
        DEFAULT: '18px',
        none: '0',
        sm: '16px',
        md: '24px',
        lg: '32px',
        xl: '40px',
        pill: '9999px',
      },
    },
  },
  plugins: []
}
