'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, Globe, Layers } from 'lucide-react';
import { api, PublicCourse } from '../../../lib/api';
import { useCourseChat } from '../../../hooks/useCourseChat';
import { AppShell } from '../../../components/layout/AppShell';
import { ChatPanel } from '../../../components/layout/ChatPanel';
import { StudioPanel } from '../../../components/layout/StudioPanel';
import { SourcesPanel } from '../../../components/layout/SourcesPanel';

const SUGGESTIONS = [
  'Summarize the key topics in this course',
  'What are the main concepts covered?',
  'List important definitions or terms',
  'What questions might appear in an exam?',
];

export default function PublicCourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const router = useRouter();

  const [course, setCourse] = useState<PublicCourse | null>(null);
  const [loading, setLoading] = useState(true);

  const { messages, streaming, error: chatError, sendMessage, clearChat } = useCourseChat(courseId, true);
  const [input, setInput] = useState('');
  const [webSearch, setWebSearch] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api.getPublicCourse(courseId)
      .then(setCourse)
      .catch(() => router.replace('/explore'))
      .finally(() => setLoading(false));
  }, [courseId, router]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = () => {
    const q = input.trim();
    if (!q || streaming) return;
    setInput('');
    sendMessage(q, webSearch);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  if (loading) return (
    <div className="min-h-dvh bg-bg-base flex items-center justify-center">
      <span className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!course) return null;

  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant' && !m.streaming);
  const sourceCount = lastAssistant?.sources?.length ?? course.documents.length;

  return (
    <AppShell
      header={
        <div className="shrink-0 px-4 py-2.5 flex items-center gap-3 border-b border-bg-border bg-bg-base">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <BookOpen className="w-3.5 h-3.5 text-secondary shrink-0" />
            <span className="text-sm font-medium text-ink truncate">{course.title}</span>
            <span className="text-xs text-secondary/80 font-mono shrink-0">{course.code}</span>
          </div>
          <div className="hidden md:flex items-center gap-3 shrink-0 text-xs text-ink-faint">
            <span>{course.level}</span>
            {course.documents.length > 0 && (
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" />{course.documents.length} docs
              </span>
            )}
            {course.author && <span>by {course.author}</span>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0 text-xs text-status-ready">
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Public</span>
          </div>
        </div>
      }
      sources={
        <SourcesPanel
          documents={course.documents}
          showWebSearch={false}
          emptyHint="The course owner hasn't added materials yet"
        />
      }
      studio={<StudioPanel />}
    >
      <ChatPanel
        title="Chat"
        subtitle={
          webSearch
            ? `Web + AI on · grounded in ${course.documents.length} course ${course.documents.length === 1 ? 'document' : 'documents'}`
            : course.documents.length > 0
              ? `Grounded in ${course.documents.length} course ${course.documents.length === 1 ? 'document' : 'documents'}`
              : 'No documents in this course yet'
        }
        messages={messages}
        streaming={streaming}
        error={chatError}
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        onClear={clearChat}
        placeholder={
          course.documents.length === 0
            ? webSearch ? 'Ask anything…' : 'No materials yet…'
            : 'Ask a question about this course…'
        }
        disabled={course.documents.length === 0 && !webSearch}
        suggestions={course.documents.length > 0 ? SUGGESTIONS : undefined}
        onSuggestion={(s) => sendMessage(s, webSearch)}
        sourceCount={sourceCount}
        webSearch={webSearch}
        onToggleWebSearch={setWebSearch}
        textareaRef={textareaRef}
        bottomRef={bottomRef}
        emptyState={
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full min-h-[280px] gap-6">
            <div className="text-center">
              <p className="text-xl font-semibold text-ink mb-2">Ask anything</p>
              <p className="text-sm text-ink-muted max-w-sm">
                {course.documents.length === 0
                  ? "The course owner hasn't added any materials yet."
                  : `Questions are answered from ${course.title} (${course.code}) course materials.`}
              </p>
            </div>
            {course.documents.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => sendMessage(s, webSearch)}
                    className="text-left text-xs text-ink-muted border border-bg-border rounded-xl px-3.5 py-3 hover:border-secondary/40 hover:text-ink hover:bg-bg-elevated transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        }
      />
    </AppShell>
  );
}
