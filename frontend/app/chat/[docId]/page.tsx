'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, BookOpen, FileText, Layers, Hash, Clock,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { api, Document } from '../../../lib/api';
import { ChatWindow } from '../../../components/ChatWindow';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ChatPage() {
  const params = useParams();
  const docId = params.docId as string;
  const { loading: authLoading } = useAuth();
  const router = useRouter();
  const [doc, setDoc] = useState<Document | null>(null);
  const [docLoading, setDocLoading] = useState(true);

  useEffect(() => {
    if (!docId || authLoading) return;

    api
      .getDocument(docId)
      .then(d => {
        if (d.status !== 'ready') {
          router.replace('/dashboard');
        } else {
          setDoc(d);
        }
      })
      .catch(() => router.replace('/dashboard'))
      .finally(() => setDocLoading(false));
  }, [docId, authLoading, router]);

  if (authLoading || docLoading) {
    return (
      <div className="min-h-dvh bg-bg-base flex items-center justify-center">
        <span className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!doc) return null;

  return (
    <div className="min-h-dvh bg-bg-base flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="shrink-0 border-b border-bg-border bg-bg-base/90 backdrop-blur-md"
      >
        <div
          className="max-w-5xl mx-auto px-4 flex items-center gap-3"
          style={{ height: '52px' }}
        >
          {/* Back */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink px-2.5 py-1.5 rounded-lg hover:bg-bg-elevated transition-all shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Back</span>
          </button>

          <div className="w-px h-4 bg-bg-border shrink-0" />

          {/* Doc name */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText className="w-3.5 h-3.5 text-ink-faint shrink-0" />
            <span className="text-sm font-medium text-ink truncate">{doc.name}</span>
          </div>

          {/* Metadata — hidden on small screens */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            {doc.page_count != null && (
              <span className="flex items-center gap-1 text-xs text-ink-faint">
                <Layers className="w-3 h-3" />
                {doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'}
              </span>
            )}
            {doc.word_count != null && (
              <span className="flex items-center gap-1 text-xs text-ink-faint">
                <Hash className="w-3 h-3" />
                {doc.word_count.toLocaleString()} words
              </span>
            )}
            {doc.processed_at && (
              <span className="flex items-center gap-1 text-xs text-ink-faint">
                <Clock className="w-3 h-3" />
                {formatDate(doc.processed_at)}
              </span>
            )}
          </div>

          <div className="w-px h-4 bg-bg-border shrink-0" />

          {/* Logo mark */}
          <div className="flex items-center gap-1.5 shrink-0">
            <BookOpen className="w-4 h-4 text-accent" />
            <span className="hidden sm:block text-xs font-semibold text-ink">StudyBuddy</span>
          </div>
        </div>
      </motion.header>

      {/* Chat — fills remaining height */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="flex-1 flex flex-col max-w-5xl w-full mx-auto overflow-hidden"
      >
        <ChatWindow documentId={docId} documentName={doc.name} />
      </motion.div>
    </div>
  );
}
