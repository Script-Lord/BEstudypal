'use client';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, Check, FileImage, FileText, Globe, Link2, Loader2, PanelLeft,
  PanelLeftClose, Plus, Presentation, Trash2, X,
} from 'lucide-react';
import { Document, api } from '../../lib/api';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useMobilePanels } from './MobilePanelsContext';

function getDocIcon(type: string) {
  if (type?.includes('image')) return FileImage;
  if (type?.includes('presentation') || type?.includes('ppt')) return Presentation;
  return FileText;
}

interface SourcesPanelProps {
  documents: Document[];
  courseId?: string;
  onAdd?: () => void;
  onDelete?: (id: string) => void;
  onOpen?: (doc: Document) => void;
  onWebSourceAdded?: () => void;
  uploadSlot?: ReactNode;
  selectable?: boolean;
  showWebSearch?: boolean;
  emptyHint?: string;
  defaultOpen?: boolean;
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isValidUrl(input: string): boolean {
  try {
    const url = new URL(normalizeUrl(input));
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

export function SourcesPanel({
  documents,
  courseId,
  onAdd,
  onDelete,
  onOpen,
  onWebSourceAdded,
  uploadSlot,
  selectable = true,
  showWebSearch = true,
  emptyHint = 'Add PDFs, DOCX, slides, or images',
  defaultOpen = true,
}: SourcesPanelProps) {
  const isMobile = useIsMobile();
  const mobilePanels = useMobilePanels();
  const [desktopOpen, setDesktopOpen] = useState(defaultOpen);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(documents.map(d => d.id)));
  const knownIds = useRef<Set<string>>(new Set());
  const [urlInput, setUrlInput] = useState('');
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const isOpen = isMobile
    ? mobilePanels?.openPanel === 'sources'
    : desktopOpen;

  const close = () => {
    if (isMobile) mobilePanels?.setOpenPanel(null);
    else setDesktopOpen(false);
  };

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

  const handleFetchUrl = async () => {
    if (!courseId || fetchingUrl) return;
    const normalized = normalizeUrl(urlInput);
    if (!isValidUrl(urlInput)) {
      setUrlError('Enter a valid URL (https://…)');
      return;
    }

    setFetchingUrl(true);
    setUrlError(null);
    try {
      await api.createWebSource({ url: normalized, courseId });
      setUrlInput('');
      onWebSourceAdded?.();
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : 'Could not fetch URL');
    } finally {
      setFetchingUrl(false);
    }
  };

  const panelBody = (
    <>
      <div className="flex items-center justify-between px-4 py-3 panel-header shrink-0">
        <h2 className="text-sm font-semibold text-ink tracking-tight">Sources</h2>
        <button
          type="button"
          onClick={close}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-bg-elevated transition-all"
          aria-label="Close sources panel"
        >
          {isMobile ? <X className="w-4 h-4" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 overscroll-contain">
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-accent/30 text-sm font-medium text-accent hover:bg-accent-muted/40 hover:border-accent/50 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add sources
          </button>
        )}

        {uploadSlot}

        {showWebSearch && courseId && (
          <div className="rounded-xl bg-bg-elevated/30 backdrop-blur-sm border border-bg-border/40 p-3">
            <p className="text-xs text-ink-muted mb-2.5">Paste a URL to fetch as a source</p>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-faint pointer-events-none" />
              <input
                type="url"
                value={urlInput}
                onChange={e => { setUrlInput(e.target.value); setUrlError(null); }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleFetchUrl(); } }}
                placeholder="https://example.com/article"
                disabled={fetchingUrl}
                className="w-full glass-input pl-9 pr-11 py-2.5 text-xs disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleFetchUrl}
                disabled={!urlInput.trim() || fetchingUrl}
                title="Fetch URL"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-bg-surface/50 backdrop-blur-sm border border-bg-border/40 flex items-center justify-center text-ink-faint hover:text-accent hover:border-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {fetchingUrl ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Link2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            {urlError && (
              <p className="mt-2 flex items-start gap-1.5 text-[11px] text-status-failed">
                <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                {urlError}
              </p>
            )}
            {!urlError && fetchingUrl && (
              <p className="mt-2 text-[11px] text-ink-faint">Fetching page content…</p>
            )}
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
                  ? 'bg-accent border-accent text-white'
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
                  className={`group flex items-center gap-2.5 px-2 py-2.5 rounded-xl transition-all ${
                    onOpen && isReady ? 'cursor-pointer hover:bg-bg-elevated active:bg-bg-elevated' : 'hover:bg-bg-elevated/60'
                  }`}
                >
                  <span className="w-7 h-7 rounded-lg bg-accent-muted flex items-center justify-center shrink-0">
                    {isProcessing
                      ? <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
                      : <Icon className="w-3.5 h-3.5 text-accent" />}
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
                      className={`${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} w-8 h-8 rounded-md flex items-center justify-center text-ink-faint hover:text-status-failed hover:bg-status-failed/10 transition-all shrink-0`}
                      aria-label="Delete source"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {selectable && (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); toggleOne(doc.id); }}
                      role="checkbox"
                      aria-checked={isChecked}
                      className={`w-5 h-5 rounded flex items-center justify-center border transition-all shrink-0 ${
                        isChecked
                          ? 'bg-accent border-accent text-white'
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
              aria-label="Close sources"
              onClick={close}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-y-0 left-0 z-50 w-[min(100vw,320px)] panel-chrome flex flex-col shadow-panel-lg md:hidden"
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
      <aside className="w-11 shrink-0 panel-chrome flex flex-col items-center py-3.5 rounded-2xl">
        <button
          type="button"
          onClick={() => setDesktopOpen(true)}
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
      className="shrink-0 panel-chrome flex flex-col overflow-hidden rounded-2xl"
    >
      {panelBody}
    </motion.aside>
  );
}
