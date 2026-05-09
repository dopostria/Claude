/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'neon-green': '#00ff88',
        'neon-red': '#ff0040',
        'neon-yellow': '#ffdd00',
        'neon-blue': '#0088ff',
        'space': '#0a0a0a',
        'room': '#0d0d1a',
        'room-border': '#1a1a2e',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.1' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        blink: {
          '0%, 89%, 100%': { transform: 'scaleY(1)' },
          '92%': { transform: 'scaleY(0.05)' },
        },
        walk: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        armSwingL: {
          '0%, 100%': { transform: 'rotate(-20deg)' },
          '50%': { transform: 'rotate(20deg)' },
        },
        armSwingR: {
          '0%, 100%': { transform: 'rotate(20deg)' },
          '50%': { transform: 'rotate(-20deg)' },
        },
        raiseArms: {
          '0%, 100%': { transform: 'rotate(-60deg)' },
        },
        fallOver: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(90deg)' },
        },
        neonPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        particleFall: {
          '0%': { transform: 'translateY(-8px)', opacity: '1' },
          '100%': { transform: 'translateY(20px)', opacity: '0' },
        },
        signalMove: {
          '0%': { opacity: '0', transform: 'scale(0)' },
          '20%': { opacity: '1', transform: 'scale(1)' },
          '80%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        glitchShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px)' },
          '75%': { transform: 'translateX(2px)' },
        },
        checkBounce: {
          '0%': { transform: 'scale(0) translateX(-50%)' },
          '60%': { transform: 'scale(1.3) translateX(-50%)' },
          '100%': { transform: 'scale(1) translateX(-50%)' },
        },
      },
      animation: {
        twinkle: 'twinkle var(--duration, 3s) var(--delay, 0s) infinite',
        scanline: 'scanline 3s linear infinite',
        blink: 'blink 4s infinite',
        walk: 'walk 0.4s ease-in-out infinite',
        armSwingL: 'armSwingL 0.4s ease-in-out infinite',
        armSwingR: 'armSwingR 0.4s ease-in-out infinite',
        neonPulse: 'neonPulse 1.5s ease-in-out infinite',
        particleFall: 'particleFall 1s ease-out infinite',
        signalMove: 'signalMove 1.2s ease-in-out forwards',
        glitchShake: 'glitchShake 0.15s linear infinite',
        checkBounce: 'checkBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
    },
  },
  plugins: [],
}
