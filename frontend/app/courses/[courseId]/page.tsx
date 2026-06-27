'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Globe, Lock, Settings, Trash2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useCourseChat } from '../../../hooks/useCourseChat';
import { api, Course, Document } from '../../../lib/api';
import { DocumentUpload } from '../../../components/DocumentUpload';
import { Button } from '../../../components/ui/Button';
import { AppShell } from '../../../components/layout/AppShell';
import { ChatPanel } from '../../../components/layout/ChatPanel';
import { StudioPanel } from '../../../components/layout/StudioPanel';
import { SourcesPanel } from '../../../components/layout/SourcesPanel';

const LEVEL_SUGGESTIONS = [
  'Primary 1','Primary 2','Primary 3','Primary 4','Primary 5','Primary 6',
  'JHS 1','JHS 2','JHS 3','SHS 1','SHS 2','SHS 3',
  'Level 100','Level 200','Level 300','Level 400','Level 500','Level 600','Level 700',
];

const SUGGESTIONS = [
  'Summarize the key topics',
  'What are the main concepts?',
  'List important definitions',
  'What does this course cover?',
];

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ title: '', code: '', level: '', description: '', is_public: false });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { messages, streaming, error: chatError, sendMessage, clearChat } = useCourseChat(courseId, false);
  const [input, setInput] = useState('');
  const [webSearch, setWebSearch] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadData = async () => {
    try {
      const [c, docs] = await Promise.all([api.getCourse(courseId), api.getCourseDocuments(courseId)]);
      setCourse(c);
      setDocuments(docs);
      setEditData({ title: c.title, code: c.code, level: c.level, description: c.description ?? '', is_public: c.is_public });
    } catch {
      router.replace('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (!authLoading) loadData(); }, [courseId, authLoading]);

  useEffect(() => {
    const hasActive = documents.some(d => d.status === 'pending' || d.status === 'processing');
    if (!hasActive) return;
    const id = setInterval(() => api.getCourseDocuments(courseId).then(setDocuments).catch(() => {}), 3000);
    return () => clearInterval(id);
  }, [documents, courseId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSave = async () => {
    if (!course) return;
    setSaving(true);
    try {
      const updated = await api.updateCourse(courseId, editData);
      setCourse(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this course? Documents will remain in your library.')) return;
    setDeleting(true);
    await api.deleteCourse(courseId).catch(() => {});
    router.replace('/dashboard');
  };

  const handleDeleteDoc = async (docId: string) => {
    await api.deleteDocument(docId).catch(() => {});
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  const handleSend = () => {
    const q = input.trim();
    if (!q || streaming) return;
    setInput('');
    sendMessage(q, webSearch);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const togglePublic = async () => {
    if (!course) return;
    const updated = await api.updateCourse(courseId, { is_public: !course.is_public }).catch(() => null);
    if (updated) setCourse(updated);
  };

  if (authLoading || loading) return (
    <div className="min-h-dvh bg-bg-base flex items-center justify-center">
      <span className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!course) return null;

  const readyDocs = documents.filter(d => d.status === 'ready');
  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant' && !m.streaming);
  const sourceCount = lastAssistant?.sources?.length ?? readyDocs.length;

  return (
    <AppShell
      header={
        <>
          <div className="shrink-0 px-4 py-2.5 flex items-center gap-3 border-b border-bg-border bg-bg-base">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <BookOpen className="w-3.5 h-3.5 text-secondary shrink-0" />
              <span className="text-sm font-medium text-ink truncate">{course.title}</span>
              <span className="text-xs text-secondary/80 font-mono shrink-0">{course.code}</span>
              <span className="text-xs text-ink-faint shrink-0 hidden sm:inline">{course.level}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={togglePublic}
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all ${
                  course.is_public ? 'text-status-ready hover:bg-status-ready/10' : 'text-ink-faint hover:text-ink hover:bg-bg-elevated'
                }`}
              >
                {course.is_public ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span className="hidden sm:block">{course.is_public ? 'Public' : 'Private'}</span>
              </button>
              <button
                type="button"
                onClick={() => setEditing(v => !v)}
                className="text-ink-faint hover:text-ink p-1.5 rounded-lg hover:bg-bg-elevated transition-all"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="text-ink-faint hover:text-status-failed p-1.5 rounded-lg hover:bg-status-failed/10 transition-all disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {editing && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-bg-border bg-bg-surface shrink-0"
              >
                <div className="px-4 py-4 grid sm:grid-cols-4 gap-3">
                  <input value={editData.title} onChange={e => setEditData(p => ({ ...p, title: e.target.value }))} placeholder="Title" className="sm:col-span-2 bg-bg-elevated border border-bg-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-secondary/40" />
                  <input value={editData.code} onChange={e => setEditData(p => ({ ...p, code: e.target.value }))} placeholder="Code" className="bg-bg-elevated border border-bg-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-secondary/40" />
                  <input value={editData.level} onChange={e => setEditData(p => ({ ...p, level: e.target.value }))} list="level-suggestions" placeholder="Level (e.g. SHS 1)" className="bg-bg-elevated border border-bg-border rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-secondary/40" />
                  <datalist id="level-suggestions">
                    {LEVEL_SUGGESTIONS.map(l => <option key={l} value={l} />)}
                  </datalist>
                  <input value={editData.description} onChange={e => setEditData(p => ({ ...p, description: e.target.value }))} placeholder="Description (optional)" className="sm:col-span-3 bg-bg-elevated border border-bg-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-secondary/40" />
                  <div className="flex items-center gap-2">
                    <Button size="sm" loading={saving} onClick={handleSave}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      }
      sources={
        <SourcesPanel
          documents={documents}
          onAdd={() => setShowUpload(v => !v)}
          onDelete={handleDeleteDoc}
          onOpen={doc => router.push(`/chat/${doc.id}`)}
          uploadSlot={
            <AnimatePresence>
              {showUpload && user && (
                <motion.div key="upload" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <DocumentUpload
                    userId={user.id}
                    courseId={courseId}
                    onDocumentQueued={() => {
                      setShowUpload(false);
                      setTimeout(() => api.getCourseDocuments(courseId).then(setDocuments), 500);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          }
        />
      }
      studio={<StudioPanel />}
    >
      <ChatPanel
        title="Chat"
        subtitle={
          webSearch
            ? `Web + AI on · grounded in ${readyDocs.length} ready ${readyDocs.length === 1 ? 'document' : 'documents'}`
            : `Searches across ${readyDocs.length} ready ${readyDocs.length === 1 ? 'document' : 'documents'}`
        }
        messages={messages}
        streaming={streaming}
        error={chatError}
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        onClear={clearChat}
        placeholder={
          readyDocs.length === 0
            ? webSearch ? 'Ask anything…' : 'Add documents first…'
            : 'Ask about this course…'
        }
        disabled={readyDocs.length === 0 && !webSearch}
        suggestions={readyDocs.length > 0 ? SUGGESTIONS : undefined}
        onSuggestion={(s) => sendMessage(s, webSearch)}
        sourceCount={sourceCount}
        webSearch={webSearch}
        onToggleWebSearch={setWebSearch}
        textareaRef={textareaRef}
        bottomRef={bottomRef}
      />
    </AppShell>
  );
}
