'use client';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check, ChevronDown, FileImage, FileText, Globe, Loader2, PanelLeft,
  PanelLeftClose, Plus, Presentation, Search, Sparkles, Trash2,
} from 'lucide-react';
import { Document } from '../../lib/api';

function getDocIcon(type: string) {
  if (type?.includes('image')) return FileImage;
  if (type?.includes('presentation') || type?.includes('ppt')) return Presentation;
  return FileText;
}

interface SourcesPanelProps {
  documents: Document[];
  onAdd?: () => void;
  onDelete?: (id: string) => void;
  onOpen?: (doc: Document) => void;
  uploadSlot?: ReactNode;
  selectable?: boolean;
  showWebSearch?: boolean;
  emptyHint?: string;
  defaultOpen?: boolean;
}

export function SourcesPanel({
  documents,
  onAdd,
  onDelete,
  onOpen,
  uploadSlot,
  selectable = true,
  showWebSearch = true,
  emptyHint = 'Add PDFs, DOCX, slides, or images',
  defaultOpen = true,
}: SourcesPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(documents.map(d => d.id)));
  const knownIds = useRef<Set<string>>(new Set());

  // Keep selection in sync as documents change: newly added docs are selected by
  // default, user toggles are preserved across re-renders (e.g. status polling).
  useEffect(() => {
    const idSet = new Set(documents.map(d => d.id));
    setSelected(prev => {
      const next = new Set<string>();
      for (const id of idSet) {
        if (!knownIds.current.has(id) || prev.has(id)) next.add(id);
      }
      return next;
    });
    knownIds.current = idSet;
  }, [documents]);

  const allSelected = documents.length > 0 && selected.size === documents.length;
  const toggleOne = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(documents.map(d => d.id)));

  const sorted = useMemo(
    () => [...documents].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    [documents],
  );

  if (!open) {
    return (
      <aside className="w-12 shrink-0 bg-bg-surface border border-bg-border flex flex-col items-center py-3.5 rounded-2xl mr-2 my-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-bg-elevated transition-all"
          aria-label="Open sources panel"
          title="Open sources"
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>
        <span className="mt-3 text-[11px] font-medium text-ink-faint tracking-wide [writing-mode:vertical-rl]">
          Sources
        </span>
      </aside>
    );
  }

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="shrink-0 bg-bg-surface border border-bg-border flex flex-col overflow-hidden rounded-2xl mr-2 my-2"
    >
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-bg-border shrink-0">
        <h2 className="text-sm font-medium text-ink">Sources</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-bg-elevated transition-all"
          aria-label="Collapse sources panel"
          title="Collapse sources"
        >
          <PanelLeftClose className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-bg-border text-sm font-medium text-ink hover:border-secondary/40 hover:bg-bg-elevated transition-all"
          >
            <Plus className="w-4 h-4 text-secondary" />
            Add sources
          </button>
        )}

        {uploadSlot}

        {showWebSearch && onAdd && (
          <div className="rounded-xl border border-bg-border bg-bg-elevated/40 p-3">
            <p className="text-xs text-ink-muted mb-2.5">Search the web for new sources</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-bg-surface border border-bg-border text-xs text-ink-muted hover:text-ink transition-all"
                title="Source type"
              >
                <Globe className="w-3.5 h-3.5" />
                <ChevronDown className="w-3 h-3" />
              </button>
              <button
                type="button"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-bg-surface border border-bg-border text-xs text-ink-muted hover:text-ink transition-all"
                title="AI options"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <ChevronDown className="w-3 h-3" />
              </button>
              <button
                type="button"
                className="ml-auto w-8 h-8 rounded-full bg-bg-surface border border-bg-border flex items-center justify-center text-ink-faint hover:text-ink transition-all"
                title="Search"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {selectable && documents.length > 0 && (
          <div className="flex items-center justify-end gap-2 px-1 pt-1">
            <span className="text-xs font-medium text-ink-muted">Select all</span>
            <button
              type="button"
              onClick={toggleAll}
              role="checkbox"
              aria-checked={allSelected}
              className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                allSelected
                  ? 'bg-secondary border-secondary text-white'
                  : 'border-bg-border bg-bg-elevated text-transparent'
              }`}
            >
              <Check className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="space-y-0.5">
          {documents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <FileText className="w-7 h-7 text-ink-faint" />
              <p className="text-xs font-medium text-ink">No sources yet</p>
              <p className="text-xs text-ink-faint">{emptyHint}</p>
            </div>
          ) : (
            sorted.map(doc => {
              const Icon = getDocIcon(doc.file_type);
              const isReady = doc.status === 'ready';
              const isProcessing = doc.status === 'pending' || doc.status === 'processing';
              const isChecked = selected.has(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => isReady && onOpen?.(doc)}
                  className={`group flex items-center gap-2.5 px-2 py-2 rounded-xl transition-all ${
                    onOpen && isReady ? 'cursor-pointer hover:bg-bg-elevated' : 'hover:bg-bg-elevated/60'
                  }`}
                >
                  <span className="w-7 h-7 rounded-lg bg-secondary-muted flex items-center justify-center shrink-0">
                    {isProcessing
                      ? <Loader2 className="w-3.5 h-3.5 text-secondary animate-spin" />
                      : <Icon className="w-3.5 h-3.5 text-secondary" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ink truncate">{doc.name}</p>
                    {!isReady && (
                      <p className={`text-[11px] mt-0.5 ${doc.status === 'failed' ? 'text-status-failed' : 'text-ink-faint'}`}>
                        {doc.status === 'failed' ? 'Failed' : 'Processing…'}
                      </p>
                    )}
                  </div>

                  {onDelete && (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); onDelete(doc.id); }}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center text-ink-faint hover:text-status-failed hover:bg-status-failed/10 transition-all shrink-0"
                      aria-label="Delete source"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}

                  {selectable && (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); toggleOne(doc.id); }}
                      role="checkbox"
                      aria-checked={isChecked}
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                        isChecked
                          ? 'bg-secondary border-secondary text-white'
                          : 'border-bg-border bg-bg-elevated text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </motion.aside>
  );
}
