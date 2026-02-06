/** @type {import('tailwindcss').Config} */
// Breakpoints (mobile-first): sm 640px, md 768px, lg 1024px, xl 1280px, 2xl 1536px
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      minHeight: { touch: '44px' },
      minWidth: { touch: '44px' },
      colors: {
        bg: '#020617',
        card: '#0b1220',
        muted: '#94a3b8',
        accent: '#38bdf8',
        accent2: '#0ea5e9',
        border: '#1e293b',
        danger: '#f97373',
        success: '#4ade80',
      },
      backdropBlur: {
        xs: '2px',
        '18': '18px',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease forwards',
        'logo-float': 'logoFloat 4s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'logo-glow': 'logoGlow 3s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'scan-finger': 'scanFinger 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        logoFloat: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-18px) scale(1.05)' },
        },
        logoGlow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 20px rgba(56,189,248,0.4))' },
          '50%': { filter: 'drop-shadow(0 0 35px rgba(56,189,248,0.6))' },
        },
        shimmer: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        scanFinger: {
          '0%': { opacity: '0', transform: 'translateY(-40px)' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1', transform: 'translateY(40px)' },
          '100%': { opacity: '0', transform: 'translateY(40px)' },
        },
      },
    },
  },
  plugins: [],
}
