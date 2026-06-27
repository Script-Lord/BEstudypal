'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Globe } from 'lucide-react';
import { usePublicCourses } from '../../hooks/useCourses';
import { CourseCard } from '../../components/CourseCard';
import { AppShell } from '../../components/layout/AppShell';

export default function ExplorePage() {
  const { courses, loading, error } = usePublicCourses();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');

  const levelFilters = ['All', ...Array.from(new Set(courses.map(c => c.level).filter(Boolean))).sort()];

  const filtered = courses.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase());
    const matchLevel = levelFilter === 'All' || c.level === levelFilter;
    return matchSearch && matchLevel;
  });

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-5 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-accent" />
            <h1 className="text-2xl font-semibold text-ink">Explore Courses</h1>
          </div>
          <p className="text-sm text-ink-muted">
            Browse public course repositories. Open any course and ask the AI questions about its materials — no account needed.
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-faint pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title or code…"
              className="w-full bg-bg-elevated border border-bg-border rounded-lg pl-8 pr-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-accent/40 transition-all"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {levelFilters.map(l => (
              <button
                key={l}
                onClick={() => setLevelFilter(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  levelFilter === l
                    ? 'bg-accent text-white'
                    : 'bg-bg-elevated border border-bg-border text-ink-muted hover:text-ink'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-44 rounded-2xl bg-bg-surface animate-pulse" style={{ opacity: 1 - i * 0.12 }} />
            ))}
          </div>
        ) : error ? (
          <p className="text-center text-sm text-status-failed py-16">{error}</p>
        ) : courses.length === 0 ? (
          <div className="text-center py-24">
            <Globe className="w-10 h-10 text-ink-faint mx-auto mb-4" />
            <p className="text-sm font-medium text-ink mb-1">No public courses yet</p>
            <p className="text-xs text-ink-muted">Sign in to create and publish a course.</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-ink-muted py-16">No courses match your filters.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                isOwner={false}
                showChatAlways
                onOpen={id => router.push(`/explore/${id}`)}
                onChat={id => router.push(`/explore/${id}`)}
              />
            ))}
          </div>
        )}
        </div>
      </div>
    </AppShell>
  );
}
