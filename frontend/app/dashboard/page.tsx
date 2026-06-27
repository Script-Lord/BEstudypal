'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Search } from 'lucide-react';
import { useCourses } from '../../hooks/useCourses';
import { useAuth } from '../../hooks/useAuth';
import { CourseCard } from '../../components/CourseCard';
import { Button } from '../../components/ui/Button';
import { AppShell } from '../../components/layout/AppShell';

export default function DashboardPage() {
  const { loading: authLoading } = useAuth();
  const { courses, loading: coursesLoading, error: coursesError, refresh: refreshCourses, deleteCourse, makePublic } = useCourses();
  const router = useRouter();

  const [search, setSearch] = useState('');

  const filteredCourses = courses
    .filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
        <div className="shrink-0 px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3 panel-header">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="w-4 h-4 text-accent shrink-0" />
            <h1 className="text-sm font-semibold text-ink truncate">StudyPal</h1>
            {courses.length > 0 && (
              <span className="text-xs text-ink-faint shrink-0">{courses.length} {courses.length === 1 ? 'course' : 'courses'}</span>
            )}
          </div>
          <Button size="sm" onClick={() => router.push('/courses/new')}>
            <Plus className="w-3.5 h-3.5" />
            New course
          </Button>
        </div>
      }
    >
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-3 sm:px-5 py-4 sm:py-6">
          {courses.length > 0 && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-faint pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search your courses…"
                className="w-full bg-bg-elevated border border-bg-border rounded-lg pl-8 pr-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-accent/40 transition-all"
              />
            </div>
          )}

          {coursesLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2].map(i => <div key={i} className="h-40 rounded-2xl bg-bg-surface animate-pulse" style={{ opacity: 1 - i * 0.3 }} />)}
            </div>
          ) : coursesError ? (
            <ErrorState message={coursesError} onRetry={refreshCourses} />
          ) : courses.length === 0 ? (
            <EmptyState onNew={() => router.push('/courses/new')} />
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
                    onDelete={deleteCourse}
                    onMakePublic={makePublic}
                  />
                ))}
              </AnimatePresence>
            </div>
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

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center py-24 gap-5">
      <div className="w-12 h-12 rounded-2xl bg-bg-surface border border-bg-border flex items-center justify-center">
        <BookOpen className="w-5 h-5 text-ink-faint" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-ink mb-1">Your courses live here</p>
        <p className="text-xs text-ink-muted max-w-xs">Create a course, upload materials, and chat with an AI that knows your content.</p>
      </div>
      <Button size="sm" onClick={onNew}><Plus className="w-3.5 h-3.5" />Create your first course</Button>
    </motion.div>
  );
}
