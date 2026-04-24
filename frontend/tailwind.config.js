/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'ui-serif', 'serif'],
      },
      colors: {
        // Warm "paper" background used by the landing page.
        cream: {
          50: '#fbf8f2',
          100: '#f6f1e7',
          200: '#ede3d0',
          300: '#dfd0b3',
        },
        // Rust / terracotta accent.
        rust: {
          DEFAULT: '#c2553b',
          dark: '#a54128',
          soft: '#d97757',
        },
        ink: {
          950: '#0b0b0a',
          900: '#1a1a18',
          800: '#2a2a28',
          700: '#3f3f3c',
          600: '#5b5b56',
        },
        // Legacy brand (used by /search and /admin pages we don't restyle).
        brand: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
          light: '#60a5fa',
        },
      },
      keyframes: {
        'gradient-pan': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '80%, 100%': { transform: 'scale(1.8)', opacity: '0' },
        },
        'caret-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        // Slow, drifting glow used behind dark sections.
        aurora: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(20px,-14px,0) scale(1.08)' },
        },
        // Smooth up-count used by CountUp.
        'count-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'gradient-pan': 'gradient-pan 16s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        blink: 'blink 1.1s step-end infinite',
        marquee: 'marquee 45s linear infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        aurora: 'aurora 18s ease-in-out infinite',
        'count-up': 'count-up 0.4s ease-out',
      },
      backgroundImage: {
        // Brand / rust accent gradient — used on hero micro-cards, role
        // showcase highlights, and the waitlist success check.
        'accent-gradient':
          'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #c2553b 100%)',
        // Faint grid overlay on dark sections (masked via CSS).
        'grid-white':
          'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
        // Faint grid on cream background.
        'grid-ink':
          'linear-gradient(to right, rgba(11,11,10,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(11,11,10,0.06) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};
