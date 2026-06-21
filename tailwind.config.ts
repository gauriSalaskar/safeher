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
          red: '#8B0000',
          red2: '#A6192E',
          dark: '#10153A',
          dark2: '#0B0E2E',
          dark3: '#161B45',
          card: '#161B45',
          card2: '#1f2552',
          border: '#2E3366',
          muted: '#8A93C9',
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
        'float-up': 'float-up linear infinite',
        'flash-red': 'flash-red 0.6s ease-out forwards',
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
          from: { boxShadow: '0 0 40px rgba(139,0,0,0.6), 0 0 80px rgba(139,0,0,0.3)' },
          to: { boxShadow: '0 0 80px rgba(166,25,46,0.9), 0 0 160px rgba(139,0,0,0.5)' },
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
        'float-up': {
          '0%': { transform: 'translateY(0) translateX(0)', opacity: '0' },
          '10%': { opacity: '0.85' },
          '90%': { opacity: '0.85' },
          '100%': { transform: 'translateY(-420px) translateX(var(--drift, 0px))', opacity: '0' },
        },
        'flash-red': {
          '0%': { opacity: '0.85' },
          '100%': { opacity: '0' },
        },
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(circle at 50% -20%, rgba(139,0,0,0.18) 0%, transparent 60%)',
        'card-gradient': 'linear-gradient(135deg, #161B45, #1f2552)',
        'sos-gradient': 'linear-gradient(145deg, #8B0000, #5c0000)',
        'dark-gradient': 'linear-gradient(180deg, #161B45 0%, #0B0E2E 100%)',
      },
    },
  },
  plugins: [],
}

export default config
