'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Globe, Lock } from 'lucide-react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '../../../components/ui/Button';
import { AppShell } from '../../../components/layout/AppShell';

const LEVEL_SUGGESTIONS = [
  'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
  'JHS 1', 'JHS 2', 'JHS 3',
  'SHS 1', 'SHS 2', 'SHS 3',
  'Level 100', 'Level 200', 'Level 300', 'Level 400',
  'Level 500', 'Level 600', 'Level 700',
];

export default function NewCoursePage() {
  const { loading: authLoading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [level, setLevel] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim() || !level.trim()) return;
    setLoading(true);
    setError('');

    try {
      const course = await api.createCourse({ title: title.trim(), code: code.trim().toUpperCase(), level: level.trim(), description: description.trim() || undefined, is_public: isPublic });
      router.push(`/courses/${course.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
      setLoading(false);
    }
  };

  if (authLoading) return (
    <div className="min-h-dvh bg-bg-base flex items-center justify-center">
      <span className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <AppShell
      header={
        <div className="shrink-0 px-4 py-2.5 flex items-center gap-3 glass-nav">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink px-2.5 py-1.5 rounded-lg hover:bg-bg-elevated/80 transition-all">
            <ArrowLeft className="w-3.5 h-3.5" />Back
          </button>
          <div className="w-px h-4 bg-bg-border" />
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-ink">New Course</span>
          </div>
        </div>
      }
    >
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-5 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-semibold text-ink mb-1">Create a course</h1>
          <p className="text-sm text-ink-muted mb-8">Add course materials and let students ask the AI about them.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">Course Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Information Literacy"
                required
                className="w-full bg-bg-elevated border border-bg-border rounded-lg px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 transition-all"
              />
            </div>

            {/* Code + Level on same row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">Course Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="e.g. INF 101"
                  required
                  className="w-full glass-input px-3 py-2.5 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">Level</label>
                <input
                  type="text"
                  value={level}
                  onChange={e => setLevel(e.target.value)}
                  list="level-suggestions"
                  placeholder="e.g. SHS 1, JHS 2, Level 100"
                  required
                  className="w-full glass-input px-3 py-2.5 text-sm"
                />
                <datalist id="level-suggestions">
                  {LEVEL_SUGGESTIONS.map(l => <option key={l} value={l} />)}
                </datalist>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">Description <span className="text-ink-faint normal-case">(optional)</span></label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief description of what this course covers…"
                rows={3}
                maxLength={1000}
                className="w-full glass-input px-3 py-2.5 text-sm resize-none"
              />
            </div>

            {/* Visibility toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl glass-panel">
              <div className="flex items-center gap-3">
                {isPublic
                  ? <Globe className="w-4 h-4 text-status-ready" />
                  : <Lock className="w-4 h-4 text-ink-faint" />
                }
                <div>
                  <p className="text-sm font-medium text-ink">{isPublic ? 'Public' : 'Private'}</p>
                  <p className="text-xs text-ink-muted">
                    {isPublic
                      ? 'Anyone can browse this course and ask the AI about it'
                      : 'Only you can see and manage this course'
                    }
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isPublic}
                onClick={() => setIsPublic(v => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${isPublic ? 'bg-accent' : 'bg-bg-elevated border border-bg-border'}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${isPublic ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
                />
              </button>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-status-failed">
                {error}
              </motion.p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" loading={loading} className="flex-1">
                Create course
              </Button>
              <Button type="button" variant="ghost" onClick={() => router.push('/dashboard')}>
                Cancel
              </Button>
            </div>
          </form>
        </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
