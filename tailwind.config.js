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
          DEFAULT: '#0a0a0f',
          light: '#12121a',
          dark: '#050508'
        },
        neon: {
          cyan: '#00f0ff',
          magenta: '#ff00aa',
          green: '#00ff88',
          purple: '#8b5cf6'
        },
        glass: {
          DEFAULT: 'rgba(255,255,255,0.03)',
          light: 'rgba(255,255,255,0.05)',
          hover: 'rgba(255,255,255,0.08)',
          border: 'rgba(255,255,255,0.1)',
        },
        ghost: {
          DEFAULT: '#e4e4e7',
          muted: '#71717a',
          dim: '#3f3f46'
        }
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0,240,255,0.4), 0 0 40px rgba(0,240,255,0.15)',
        'glow-cyan-sm': '0 0 10px rgba(0,240,255,0.3), 0 0 20px rgba(0,240,255,0.1)',
        'glow-magenta': '0 0 20px rgba(255,0,170,0.4), 0 0 40px rgba(255,0,170,0.15)',
        'glow-magenta-sm': '0 0 10px rgba(255,0,170,0.3), 0 0 20px rgba(255,0,170,0.1)',
        'glow-green': '0 0 15px rgba(0,255,136,0.4), 0 0 30px rgba(0,255,136,0.15)',
        'glass': '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-lg': '0 12px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      borderRadius: {
        'glass': '20px',
        'pill': '9999px',
      },
      letterSpacing: {
        'tracking-wide': '0.05em',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'typing': 'typing-cursor 1s step-end infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,240,255,0.3)' },
          '50%': { boxShadow: '0 0 35px rgba(0,240,255,0.5)' },
        },
        'typing-cursor': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        }
      }
    },
  },
  plugins: []
}
