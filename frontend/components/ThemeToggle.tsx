'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

type Theme = 'light' | 'dark';

function getActiveTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  try {
    localStorage.setItem('theme', theme);
  } catch {
    /* ignore persistence errors (e.g. private mode) */
  }
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getActiveTheme());
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  };

  const isDark = theme === 'dark';
  const nextLabel = isDark ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${nextLabel} mode`}
      title={`Switch to ${nextLabel} mode`}
      className={`fixed z-[60] flex items-center justify-center w-10 h-10 rounded-xl
        bg-bg-surface/90 backdrop-blur border border-bg-border text-ink-muted
        hover:text-accent hover:border-accent/40 shadow-panel
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50
        transition-colors duration-150
        bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4
        md:bottom-4 md:left-4 md:right-auto ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={mounted ? theme : 'init'}
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="flex items-center justify-center"
        >
          {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
