'use client';
import { FileText, Layers } from 'lucide-react';
import { useMobilePanels } from './MobilePanelsContext';

export function MobilePanelBar() {
  const ctx = useMobilePanels();
  if (!ctx || (!ctx.hasSources && !ctx.hasStudio)) return null;

  const { openPanel, togglePanel, hasSources, hasStudio } = ctx;

  const btn = (active: boolean) =>
    `flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all duration-150 ${
      active
        ? 'bg-accent-muted/60 border-accent/30 text-accent shadow-sm'
        : 'bg-bg-surface border-bg-border text-ink-muted hover:border-accent/20'
    }`;

  return (
    <div className="md:hidden shrink-0 px-3 py-2 flex items-center gap-2 border-b border-bg-border bg-bg-surface/80 backdrop-blur-sm">
      {hasSources && (
        <button type="button" onClick={() => togglePanel('sources')} className={btn(openPanel === 'sources')}>
          <FileText className="w-3.5 h-3.5" />
          Sources
        </button>
      )}
      {hasStudio && (
        <button type="button" onClick={() => togglePanel('studio')} className={btn(openPanel === 'studio')}>
          <Layers className="w-3.5 h-3.5" />
          Studio
        </button>
      )}
    </div>
  );
}
