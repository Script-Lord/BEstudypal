import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: 'rgb(var(--color-bg-base) / <alpha-value>)',
          surface: 'rgb(var(--color-bg-surface) / <alpha-value>)',
          elevated: 'rgb(var(--color-bg-elevated) / <alpha-value>)',
          border: 'rgb(var(--color-bg-border) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          muted: 'rgb(var(--color-ink-muted) / <alpha-value>)',
          faint: 'rgb(var(--color-ink-faint) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          hover: 'rgb(var(--color-accent-hover) / <alpha-value>)',
          muted: 'rgb(var(--color-accent-muted) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)',
          hover: 'rgb(var(--color-secondary-hover) / <alpha-value>)',
          muted: 'rgb(var(--color-secondary-muted) / <alpha-value>)',
        },
        status: {
          pending: 'rgb(var(--color-status-pending) / <alpha-value>)',
          processing: 'rgb(var(--color-status-processing) / <alpha-value>)',
          ready: 'rgb(var(--color-status-ready) / <alpha-value>)',
          failed: 'rgb(var(--color-status-failed) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 3px rgb(0 0 0 / 0.06), 0 4px 16px rgb(0 0 0 / 0.04)',
        'panel-lg': '0 4px 24px rgb(0 0 0 / 0.12)',
        glow: '0 0 20px rgb(var(--color-accent) / 0.15)',
        glass: '0 8px 32px rgb(0 0 0 / 0.08)',
        'glass-lg': '0 16px 48px rgb(0 0 0 / 0.12)',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
      },
      backdropBlur: {
        xs: '2px',
        glass: '12px',
        'glass-lg': '20px',
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
