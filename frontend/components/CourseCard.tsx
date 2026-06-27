'use client';
import { motion } from 'framer-motion';
import { BookOpen, FileText, Globe, Lock, MessageSquare, Settings, Trash2 } from 'lucide-react';
import type { Course } from '../lib/api';

interface Props {
  course: Course;
  isOwner?: boolean;
  showChatAlways?: boolean;
  onChat?: (id: string) => void;
  onManage?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const LEVEL_BADGE: Record<string, string> = {
  'Level 100': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  'Level 200': 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  'Level 300': 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  'Level 400': 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  'Level 500': 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  'Level 600': 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  'Level 700': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
};

export function CourseCard({ course, isOwner = false, showChatAlways = false, onChat, onManage, onDelete }: Props) {
  const levelStyle = LEVEL_BADGE[course.level] ?? 'text-ink-muted bg-bg-elevated border-bg-border';
  const docCount = Number(course.doc_count ?? 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex flex-col gap-3 p-5 rounded-2xl border border-bg-border bg-bg-surface hover:border-accent/30 hover:bg-bg-elevated/50 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink leading-tight truncate">{course.title}</p>
            <p className="text-xs text-accent/80 font-mono mt-0.5">{course.code}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${levelStyle}`}>
            {course.level}
          </span>
          {course.is_public
            ? <span title="Public"><Globe className="w-3.5 h-3.5 text-status-ready" /></span>
            : <span title="Private"><Lock className="w-3.5 h-3.5 text-ink-faint" /></span>
          }
        </div>
      </div>

      {/* Description */}
      {course.description && (
        <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">{course.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-bg-border/50">
        <div className="flex items-center gap-2 text-xs text-ink-faint">
          <FileText className="w-3 h-3" />
          <span>{docCount} {docCount === 1 ? 'document' : 'documents'}</span>
          {course.author && !isOwner && (
            <span className="text-ink-faint/60">· {course.author}</span>
          )}
        </div>

        <div className={`flex items-center gap-0.5 transition-opacity ${showChatAlways ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {onChat && docCount > 0 && (
            <button
              onClick={() => onChat(course.id)}
              className="flex items-center gap-1 text-xs text-ink-muted hover:text-accent px-2.5 py-1.5 rounded-lg hover:bg-accent/10 transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </button>
          )}
          {isOwner && onManage && (
            <button
              onClick={() => onManage(course.id)}
              title="Manage"
              className="text-ink-faint hover:text-ink p-1.5 rounded-lg hover:bg-bg-elevated transition-all"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
          {isOwner && onDelete && (
            <button
              onClick={() => onDelete(course.id)}
              title="Delete"
              className="text-ink-faint hover:text-status-failed p-1.5 rounded-lg hover:bg-status-failed/10 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
