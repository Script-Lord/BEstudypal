'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FileText, Layers, Hash, Clock } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { api, Document } from '../../../lib/api';
import { ChatWindow } from '../../../components/ChatWindow';
import { AppShell } from '../../../components/layout/AppShell';
import { StudioPanel } from '../../../components/layout/StudioPanel';
import { SourcesPanel } from '../../../components/layout/SourcesPanel';

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
    <AppShell
      header={
        <div className="shrink-0 px-4 py-2.5 flex items-center gap-3 border-b border-bg-border bg-bg-base">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="text-sm font-medium text-ink truncate">{doc.name}</span>
          </div>
          <div className="hidden md:flex items-center gap-4 shrink-0 text-xs text-ink-faint">
            {doc.page_count != null && (
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'}
              </span>
            )}
            {doc.word_count != null && (
              <span className="flex items-center gap-1">
                <Hash className="w-3 h-3" />
                {doc.word_count.toLocaleString()} words
              </span>
            )}
            {doc.processed_at && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(doc.processed_at)}
              </span>
            )}
          </div>
        </div>
      }
      sources={
        <SourcesPanel
          documents={[doc]}
          showWebSearch={false}
        />
      }
      studio={<StudioPanel />}
    >
      <ChatWindow documentId={docId} documentName={doc.name} />
    </AppShell>
  );
}
