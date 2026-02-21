/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Syne', 'sans-serif']
      },
      colors: {
        surface: {
          0: '#0a0b0d',
          1: '#111318',
          2: '#181b22',
          3: '#1e2229',
          4: '#252b35'
        },
        brand: {
          50: '#e8f5ff',
          100: '#d1ebff',
          200: '#a3d7ff',
          300: '#66bcff',
          400: '#2196ff',
          500: '#0070f3',
          600: '#0052cc',
          700: '#003d99',
          800: '#002966',
          900: '#001433'
        },
        accent: {
          amber: '#f59e0b',
          green: '#10b981',
          red: '#ef4444',
          purple: '#8b5cf6'
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem'
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'elevated': '0 4px 16px rgba(0,0,0,0.5)',
        'brand': '0 0 20px rgba(33,150,255,0.15)'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite'
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        pulseSoft: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.6 } }
      }
    }
  },
  plugins: []
}
