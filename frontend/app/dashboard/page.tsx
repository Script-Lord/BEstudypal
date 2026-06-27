'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, X, Search, ChevronDown } from 'lucide-react';
import { useDocuments } from '../../hooks/useDocuments';
import { useCourses } from '../../hooks/useCourses';
import { useAuth } from '../../hooks/useAuth';
import { DocumentCard } from '../../components/DocumentCard';
import { DocumentUpload } from '../../components/DocumentUpload';
import { CourseCard } from '../../components/CourseCard';
import { Button } from '../../components/ui/Button';
import { AppShell } from '../../components/layout/AppShell';

type Tab = 'courses' | 'documents';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { documents, loading: docsLoading, error: docsError, refresh: refreshDocs, deleteDocument } = useDocuments();
  const { courses, loading: coursesLoading, error: coursesError, refresh: refreshCourses, deleteCourse } = useCourses();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('courses');
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('created_at');

  // Poll while any document is processing
  useEffect(() => {
    const hasActive = documents.some(d => d.status === 'pending' || d.status === 'processing');
    if (!hasActive) return;
    const id = setInterval(refreshDocs, 3000);
    return () => clearInterval(id);
  }, [documents, refreshDocs]);

  const handleDocumentQueued = useCallback(() => {
    setShowUpload(false);
    setTimeout(refreshDocs, 500);
  }, [refreshDocs]);

  const filteredDocs = documents
    .filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'status') return a.status.localeCompare(b.status);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const filteredCourses = courses
    .filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'name') return a.title.localeCompare(b.title);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  if (authLoading) {
    return (
      <div className="min-h-dvh bg-bg-base flex items-center justify-center">
        <span className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppShell
      header={
        <div className="shrink-0 px-4 py-2.5 flex items-center justify-between gap-3 border-b border-bg-border bg-bg-base">
          <div className="flex items-center gap-1 bg-bg-surface border border-bg-border rounded-lg p-1">
            {(['courses', 'documents'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setSearch(''); setShowUpload(false); }}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  tab === t
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {t === 'courses' ? `Courses (${courses.length})` : `Documents (${documents.length})`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {tab === 'courses' && (
              <Button size="sm" onClick={() => router.push('/courses/new')}>
                <Plus className="w-3.5 h-3.5" />
                New course
              </Button>
            )}
            {tab === 'documents' && (
              <Button size="sm" onClick={() => setShowUpload(v => !v)}>
                {showUpload ? <><X className="w-3.5 h-3.5" />Cancel</> : <><Plus className="w-3.5 h-3.5" />Upload</>}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-5 py-6">
        {/* Upload panel */}
        <AnimatePresence>
          {tab === 'documents' && showUpload && user && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <DocumentUpload userId={user.id} onDocumentQueued={handleDocumentQueued} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter / sort bar */}
        {((tab === 'courses' && courses.length > 0) || (tab === 'documents' && documents.length > 0)) && (
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-faint pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={tab === 'courses' ? 'Filter by title or code…' : 'Filter documents…'}
                className="w-full bg-bg-elevated border border-bg-border rounded-lg pl-8 pr-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-accent/40 transition-all"
              />
            </div>
            <div className="relative">
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="appearance-none bg-bg-elevated border border-bg-border rounded-lg pl-3 pr-7 py-2 text-xs text-ink-muted focus:outline-none focus:ring-1 focus:ring-accent/40 cursor-pointer"
              >
                <option value="created_at">Newest first</option>
                <option value="name">Name A–Z</option>
                {tab === 'documents' && <option value="status">By status</option>}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-faint pointer-events-none" />
            </div>
          </div>
        )}

        {/* ── Courses tab ── */}
        {tab === 'courses' && (
          coursesLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2].map(i => <div key={i} className="h-40 rounded-2xl bg-bg-surface animate-pulse" style={{ opacity: 1 - i * 0.3 }} />)}
            </div>
          ) : coursesError ? (
            <ErrorState message={coursesError} onRetry={refreshCourses} />
          ) : courses.length === 0 ? (
            <CourseEmptyState onNew={() => router.push('/courses/new')} />
          ) : filteredCourses.length === 0 ? (
            <p className="text-center text-sm text-ink-muted py-16">No courses match &ldquo;{search}&rdquo;</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <AnimatePresence>
                {filteredCourses.map(c => (
                  <CourseCard
                    key={c.id}
                    course={c}
                    isOwner
                    onOpen={id => router.push(`/courses/${id}`)}
                    onChat={id => router.push(`/courses/${id}`)}
                    onManage={id => router.push(`/courses/${id}`)}
                    onDelete={deleteCourse}
                  />
                ))}
              </AnimatePresence>
            </div>
          )
        )}

        {/* ── Documents tab ── */}
        {tab === 'documents' && (
          docsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-bg-surface animate-pulse" style={{ opacity: 1 - i * 0.2 }} />)}
            </div>
          ) : docsError ? (
            <ErrorState message={docsError} onRetry={refreshDocs} />
          ) : documents.length === 0 ? (
            <DocEmptyState onUpload={() => setShowUpload(true)} />
          ) : filteredDocs.length === 0 ? (
            <p className="text-center text-sm text-ink-muted py-16">No documents match &ldquo;{search}&rdquo;</p>
          ) : (
            <motion.div layout className="space-y-1.5">
              <AnimatePresence>
                {filteredDocs.map(doc => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    onChat={id => router.push(`/chat/${id}`)}
                    onDelete={deleteDocument}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )
        )}
        </div>
      </div>
    </AppShell>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-16">
      <p className="text-sm text-status-failed">{message}</p>
      <button onClick={onRetry} className="mt-3 text-xs text-accent hover:text-accent-hover transition-colors">Retry</button>
    </div>
  );
}

function CourseEmptyState({ onNew }: { onNew: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center py-24 gap-5">
      <div className="w-12 h-12 rounded-2xl bg-bg-surface border border-bg-border flex items-center justify-center">
        <BookOpen className="w-5 h-5 text-ink-faint" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-ink mb-1">No courses yet</p>
        <p className="text-xs text-ink-muted max-w-xs">Create a course to organise your documents by subject and level. Share it publicly so anyone can ask the AI about it.</p>
      </div>
      <Button size="sm" onClick={onNew}><Plus className="w-3.5 h-3.5" />Create your first course</Button>
    </motion.div>
  );
}

function DocEmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center py-24 gap-5">
      <div className="w-12 h-12 rounded-2xl bg-bg-surface border border-bg-border flex items-center justify-center">
        <BookOpen className="w-5 h-5 text-ink-faint" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-ink mb-1">No documents yet</p>
        <p className="text-xs text-ink-muted max-w-xs">Upload PDF, DOCX, PPTX, or images here, or go to a course and upload directly to it.</p>
      </div>
      <Button size="sm" onClick={onUpload}><Plus className="w-3.5 h-3.5" />Upload a document</Button>
    </motion.div>
  );
}
