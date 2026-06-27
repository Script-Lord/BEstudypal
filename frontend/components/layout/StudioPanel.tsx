'use client';
import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, ChevronRight, Headphones, Layers,
  Map, PanelLeft, PanelRight, Plus, Presentation, Table2, X,
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useMobilePanels } from './MobilePanelsContext';

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
  const isMobile = useIsMobile();
  const mobilePanels = useMobilePanels();
  const [desktopOpen, setDesktopOpen] = useState(defaultOpen);

  const isOpen = isMobile
    ? mobilePanels?.openPanel === 'studio'
    : desktopOpen;

  const close = () => {
    if (isMobile) mobilePanels?.setOpenPanel(null);
    else setDesktopOpen(false);
  };

  const panelBody = (
    <>
      <div className="flex items-center justify-between px-4 py-3 panel-header shrink-0">
        <h2 className="text-sm font-semibold text-ink tracking-tight">Studio</h2>
        <button
          type="button"
          onClick={close}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-bg-elevated transition-all"
          aria-label="Close studio panel"
        >
          {isMobile ? <X className="w-4 h-4" /> : <PanelRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 overscroll-contain">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {STUDIO_TOOLS.map(tool => {
            const { label, icon: Icon } = tool;
            const badge = 'badge' in tool ? tool.badge : undefined;
            return (
              <button
                key={label}
                type="button"
                className="group flex items-center gap-2 px-2.5 py-3 rounded-xl bg-bg-elevated/50 border border-bg-border hover:border-accent/25 hover:bg-accent-muted/30 active:bg-accent-muted/40 transition-all text-left"
              >
                <span className="w-7 h-7 rounded-lg bg-accent-muted flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-accent" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[11px] font-medium text-ink truncate">{label}</span>
                  {badge && (
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-accent/70">
                      {badge}
                    </span>
                  )}
                </span>
                <ChevronRight className="w-3 h-3 text-ink-faint group-hover:text-accent shrink-0" />
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
        <div className="shrink-0 px-4 py-4 border-t border-bg-border pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-4">
          {footerAction}
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 md:hidden"
              aria-label="Close studio"
              onClick={close}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-y-0 right-0 z-50 w-[min(100vw,320px)] panel-chrome flex flex-col shadow-panel-lg md:hidden"
            >
              {panelBody}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  if (!isOpen) {
    return (
      <aside className="w-11 shrink-0 panel-chrome flex flex-col items-center py-3.5 rounded-l-2xl">
        <button
          type="button"
          onClick={() => setDesktopOpen(true)}
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
      className="shrink-0 panel-chrome flex flex-col overflow-hidden rounded-l-2xl"
    >
      {panelBody}
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
