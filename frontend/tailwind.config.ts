import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#09090e',
          surface: '#111119',
          elevated: '#1a1a26',
          border: '#1f1f2e',
        },
        ink: {
          DEFAULT: '#e2e2ef',
          muted: '#8888a8',
          faint: '#4a4a6a',
        },
        accent: {
          DEFAULT: '#6366f1',
          hover: '#7c7ffa',
          muted: 'rgba(99,102,241,0.15)',
        },
        status: {
          pending: '#f59e0b',
          processing: '#3b82f6',
          ready: '#22c55e',
          failed: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
