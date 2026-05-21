import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
      },
      colors: {
        brand: {
          red: '#FF2D55',
          red2: '#FF6B6B',
          dark: '#080B14',
          dark2: '#0D1220',
          dark3: '#111827',
          card: '#111827',
          card2: '#1a2236',
          border: '#1e2d47',
          muted: '#7B8DB0',
          green: '#00E676',
          amber: '#FFB300',
          blue: '#3D8EFF',
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2.5s ease-out infinite',
        'pulse-dot': 'pulse-dot 2s infinite',
        'sos-glow': 'sos-glow 1s ease-in-out infinite alternate',
        'wave': 'wave 1.2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease forwards',
        'slide-up': 'slide-up 0.4s ease forwards',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { opacity: '0.5', transform: 'scale(0.8)' },
          '100%': { opacity: '0', transform: 'scale(1.1)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.3)' },
        },
        'sos-glow': {
          from: { boxShadow: '0 0 40px rgba(255,45,85,0.5), 0 0 80px rgba(255,45,85,0.2)' },
          to: { boxShadow: '0 0 80px rgba(255,45,85,0.9), 0 0 160px rgba(255,45,85,0.5)' },
        },
        'wave': {
          '0%, 100%': { transform: 'scaleY(0.5)', opacity: '0.5' },
          '50%': { transform: 'scaleY(1)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(circle at 50% -20%, rgba(255,45,85,0.15) 0%, transparent 60%)',
        'card-gradient': 'linear-gradient(135deg, #111827, #1a2236)',
        'sos-gradient': 'linear-gradient(145deg, #FF2D55, #c0003c)',
        'dark-gradient': 'linear-gradient(180deg, #0a1628 0%, #0D1220 100%)',
      },
    },
  },
  plugins: [],
}

export default config
