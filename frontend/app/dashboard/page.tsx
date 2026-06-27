'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Plus, LogOut, FileText, X, Search, ChevronDown,
} from 'lucide-react';
import { signOut } from '../../lib/auth';
import { useDocuments } from '../../hooks/useDocuments';
import { useAuth } from '../../hooks/useAuth';
import { DocumentCard } from '../../components/DocumentCard';
import { DocumentUpload } from '../../components/DocumentUpload';
import { Button } from '../../components/ui/Button';

type SortKey = 'created_at' | 'name' | 'status';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { documents, loading, error, refresh, deleteDocument } = useDocuments();
  const router = useRouter();

  const [showUpload, setShowUpload] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('created_at');

  // Poll while any document is still processing
  useEffect(() => {
    const hasActive = documents.some(
      d => d.status === 'pending' || d.status === 'processing'
    );
    if (!hasActive) return;
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [documents, refresh]);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    await signOut();
    router.replace('/login');
  }, [router]);

  const handleQueued = useCallback(
    (docId: string) => {
      setShowUpload(false);
      setTimeout(refresh, 500);
    },
    [refresh]
  );

  const filtered = documents
    .filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'status') return a.status.localeCompare(b.status);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const readyCount = documents.filter(d => d.status === 'ready').length;
  const processingCount = documents.filter(
    d => d.status === 'pending' || d.status === 'processing'
  ).length;

  if (authLoading) {
    return (
      <div className="min-h-dvh bg-bg-base flex items-center justify-center">
        <span className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg-base">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-bg-border bg-bg-base/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-5 h-13 flex items-center justify-between gap-4" style={{ height: '52px' }}>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4.5 h-4.5 text-accent" style={{ width: '18px', height: '18px' }} />
            <span className="text-sm font-semibold text-ink tracking-tight">StudyBuddy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-xs text-ink-faint truncate max-w-[180px]">
              {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink px-2.5 py-1.5 rounded-lg hover:bg-bg-elevated transition-all disabled:opacity-40"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Sign out</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-5 py-9">

        {/* Page header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-lg font-semibold text-ink">Documents</h1>
            {!loading && documents.length > 0 && (
              <p className="text-xs text-ink-faint mt-0.5">
                {readyCount} ready
                {processingCount > 0 && (
                  <span className="ml-1.5 text-status-processing">· {processingCount} processing</span>
                )}
              </p>
            )}
          </div>
          <Button size="sm" onClick={() => setShowUpload(v => !v)}>
            {showUpload
              ? <><X className="w-3.5 h-3.5" />Cancel</>
              : <><Plus className="w-3.5 h-3.5" />Upload</>}
          </Button>
        </div>

        {/* Upload panel */}
        <AnimatePresence>
          {showUpload && user && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <DocumentUpload userId={user.id} onDocumentQueued={handleQueued} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter / sort bar — only when there are docs */}
        {!loading && documents.length > 0 && (
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-faint pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter documents…"
                className="w-full bg-bg-elevated border border-bg-border rounded-lg pl-8 pr-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-accent/40 transition-all"
              />
            </div>
            <div className="relative">
              <select
                value={sort}
                onChange={e => setSort(e.target.value as SortKey)}
                className="appearance-none bg-bg-elevated border border-bg-border rounded-lg pl-3 pr-7 py-2 text-xs text-ink-muted focus:outline-none focus:ring-1 focus:ring-accent/40 transition-all cursor-pointer"
              >
                <option value="created_at">Newest first</option>
                <option value="name">Name A–Z</option>
                <option value="status">By status</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-faint pointer-events-none" />
            </div>
          </div>
        )}

        {/* Document list */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="h-16 rounded-xl bg-bg-surface animate-pulse"
                style={{ opacity: 1 - i * 0.2 }}
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-sm text-status-failed">{error}</p>
            <button
              onClick={refresh}
              className="mt-3 text-xs text-accent hover:text-accent-hover transition-colors"
            >
              Retry
            </button>
          </div>
        ) : documents.length === 0 ? (
          <EmptyState onUpload={() => setShowUpload(true)} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-ink-muted">
            No documents match &ldquo;{search}&rdquo;
          </div>
        ) : (
          <motion.div layout className="space-y-1.5">
            <AnimatePresence>
              {filtered.map(doc => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onChat={id => router.push(`/chat/${id}`)}
                  onDelete={deleteDocument}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 gap-5"
    >
      <div className="w-12 h-12 rounded-2xl bg-bg-surface border border-bg-border flex items-center justify-center">
        <FileText className="w-5 h-5 text-ink-faint" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-ink mb-1">No documents yet</p>
        <p className="text-xs text-ink-muted max-w-xs">
          Upload a PDF, DOCX, PPTX, or image. The AI will extract and index it
          so you can ask questions in plain language.
        </p>
      </div>
      <Button size="sm" onClick={onUpload}>
        <Plus className="w-3.5 h-3.5" />
        Upload your first document
      </Button>
    </motion.div>
  );
}
