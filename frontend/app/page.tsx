'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BookOpen, ArrowRight, Globe, MessageSquare,
  Sparkles, FileText, Layers, ChevronRight,
} from 'lucide-react';
import { getCurrentUser } from '../lib/auth';
import { usePublicCourses } from '../hooks/useCourses';
import type { Course } from '../lib/api';

const LEVEL_BADGE: Record<string, string> = {
  'Level 100': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  'Level 200': 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  'Level 300': 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  'Level 400': 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  'Level 500': 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  'Level 600': 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  'Level 700': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
};

function PopularCourseCard({ course, onChat }: { course: Course; onChat: (id: string) => void }) {
  const levelStyle = LEVEL_BADGE[course.level] ?? 'text-ink-muted bg-bg-elevated border-bg-border';
  const docCount = Number(course.doc_count ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 p-5 rounded-2xl border border-bg-border bg-bg-surface hover:border-accent/40 hover:bg-bg-elevated/30 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink truncate">{course.title}</p>
            <p className="text-xs text-accent/80 font-mono mt-0.5">{course.code}</p>
          </div>
        </div>
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${levelStyle}`}>
          {course.level}
        </span>
      </div>

      {course.description && (
        <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">{course.description}</p>
      )}

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-bg-border/50">
        <div className="flex items-center gap-3 text-xs text-ink-faint">
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {docCount} {docCount === 1 ? 'doc' : 'docs'}
          </span>
          {course.author && (
            <span className="flex items-center gap-1">
              by {course.author}
            </span>
          )}
        </div>

        <button
          onClick={() => onChat(course.id)}
          disabled={docCount === 0}
          className="flex items-center gap-1.5 text-xs font-medium text-accent border border-accent/30 rounded-lg px-3 py-1.5 hover:bg-accent hover:text-white hover:border-accent transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <MessageSquare className="w-3 h-3" />
          Try Chat
        </button>
      </div>
    </motion.div>
  );
}

export default function RootPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const { courses, loading } = usePublicCourses();

  useEffect(() => {
    getCurrentUser().then(user => {
      if (user) {
        router.replace('/dashboard');
      } else {
        setAuthChecked(true);
      }
    });
  }, [router]);

  const popularCourses = courses
    .filter(c => Number(c.doc_count ?? 0) > 0)
    .slice(0, 3);

  const handleChat = (id: string) => router.push(`/explore/${id}`);

  if (!authChecked) {
    return (
      <div className="min-h-dvh bg-bg-base flex items-center justify-center">
        <span className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg-base flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-bg-border bg-bg-base/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-5 flex items-center justify-between" style={{ height: 52 }}>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-ink">StudyPal</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/explore')}
              className="text-xs text-ink-muted hover:text-ink px-3 py-1.5 rounded-lg hover:bg-bg-elevated transition-all"
            >
              Explore
            </button>
            <button
              onClick={() => router.push('/login')}
              className="text-xs text-ink-muted hover:text-ink px-3 py-1.5 rounded-lg hover:bg-bg-elevated transition-all"
            >
              Sign in
            </button>
            <button
              onClick={() => router.push('/register')}
              className="text-xs font-medium bg-accent hover:bg-accent-hover text-white px-3.5 py-1.5 rounded-lg transition-all"
            >
              Sign up free
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-5 pt-20 pb-16 text-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-accent border border-accent/20 bg-accent/5 rounded-full px-3 py-1 mb-6">
              <Sparkles className="w-3 h-3" />
              No account needed to chat
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-ink tracking-tight leading-tight mb-4">
              Ask your study materials<br />
              <span className="text-accent">anything.</span>
            </h1>
            <p className="text-base text-ink-muted max-w-xl mx-auto mb-8 leading-relaxed">
              StudyPal turns course documents into an AI you can question.
              Browse public courses and start chatting instantly — no sign-in required.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => router.push('/register')}
                className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all"
              >
                Get started free
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push('/explore')}
                className="flex items-center gap-2 bg-bg-surface border border-bg-border text-sm text-ink-muted hover:text-ink hover:border-accent/30 px-5 py-2.5 rounded-xl transition-all"
              >
                <Globe className="w-4 h-4" />
                Browse all courses
              </button>
            </div>
          </motion.div>
        </section>

        {/* Popular Courses */}
        <section className="max-w-5xl mx-auto px-5 pb-20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-ink">Popular Courses</h2>
              <p className="text-xs text-ink-muted mt-0.5">Click &ldquo;Try Chat&rdquo; to start asking questions — no account needed</p>
            </div>
            <button
              onClick={() => router.push('/explore')}
              className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-44 rounded-2xl bg-bg-surface border border-bg-border animate-pulse" />
              ))}
            </div>
          ) : popularCourses.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-bg-border rounded-2xl">
              <Layers className="w-8 h-8 text-ink-faint mx-auto mb-3" />
              <p className="text-sm text-ink-muted mb-1">No public courses yet</p>
              <p className="text-xs text-ink-faint">Be the first to publish one.</p>
              <button
                onClick={() => router.push('/register')}
                className="mt-4 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
              >
                Sign up and create a course →
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {popularCourses.map(course => (
                <PopularCourseCard key={course.id} course={course} onChat={handleChat} />
              ))}
            </div>
          )}
        </section>

        {/* Bottom CTA */}
        <section className="border-t border-bg-border bg-bg-surface">
          <div className="max-w-5xl mx-auto px-5 py-12 text-center">
            <h2 className="text-lg font-semibold text-ink mb-2">Ready to study smarter?</h2>
            <p className="text-sm text-ink-muted mb-6">Upload your own course materials and build an AI tutor in minutes.</p>
            <button
              onClick={() => router.push('/register')}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all"
            >
              Create your first course
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
