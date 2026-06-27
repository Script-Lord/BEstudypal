'use client';
import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, ChevronRight, Headphones, Layers,
  Map, PanelLeft, PanelRight, Plus, Presentation, Table2,
} from 'lucide-react';

const STUDIO_TOOLS = [
  { label: 'Audio Overview', icon: Headphones },
  { label: 'Slide Deck', icon: Presentation, badge: 'BETA' },
  { label: 'Video Overview', icon: Layers },
  { label: 'Mind Map', icon: Map },
  { label: 'Quiz', icon: Brain },
  { label: 'Data Table', icon: Table2 },
] as const;

interface StudioPanelProps {
  children?: ReactNode;
  footerAction?: ReactNode;
  defaultOpen?: boolean;
}

export function StudioPanel({ children, footerAction, defaultOpen = true }: StudioPanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (!open) {
    return (
      <aside className="w-12 shrink-0 bg-bg-surface border-l border-bg-border flex flex-col items-center py-3.5 rounded-l-2xl ml-2 my-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-bg-elevated transition-all"
          aria-label="Open studio panel"
          title="Open studio panel"
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>
        <span className="mt-3 text-[11px] font-medium text-ink-faint tracking-wide [writing-mode:vertical-rl] rotate-180">
          Studio
        </span>
      </aside>
    );
  }

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="shrink-0 bg-bg-surface border-l border-bg-border flex flex-col overflow-hidden rounded-l-2xl ml-2 my-2"
    >
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-bg-border shrink-0">
        <h2 className="text-sm font-medium text-ink">Studio</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-bg-elevated transition-all"
          aria-label="Collapse studio panel"
          title="Collapse studio panel"
        >
          <PanelRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="grid grid-cols-2 gap-2">
          {STUDIO_TOOLS.map(tool => {
            const { label, icon: Icon } = tool;
            const badge = 'badge' in tool ? tool.badge : undefined;
            return (
            <button
              key={label}
              type="button"
              className="group flex items-center gap-2 px-2.5 py-2.5 rounded-xl bg-bg-elevated/60 border border-bg-border hover:border-secondary/30 hover:bg-secondary-muted transition-all text-left"
            >
              <span className="w-7 h-7 rounded-lg bg-secondary-muted flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-secondary" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[11px] font-medium text-ink truncate">{label}</span>
                {badge && (
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-secondary/80">
                    {badge}
                  </span>
                )}
              </span>
              <ChevronRight className="w-3 h-3 text-ink-faint group-hover:text-secondary shrink-0" />
            </button>
            );
          })}
        </div>

        {children && (
          <div className="mt-4 pt-4 border-t border-bg-border space-y-1">
            {children}
          </div>
        )}
      </div>

      {footerAction && (
        <div className="shrink-0 px-4 py-4 border-t border-bg-border">
          {footerAction}
        </div>
      )}
    </motion.aside>
  );
}

export function StudioAddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-1.5 text-sm font-medium text-ink bg-white hover:bg-white/90 rounded-full py-2.5 transition-all shadow-sm"
    >
      <Plus className="w-4 h-4" />
      {label}
    </button>
  );
}
