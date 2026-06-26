'use client';
import { motion } from 'framer-motion';
import { FileText, FileImage, Presentation, Trash2, MessageSquare, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Document } from '../lib/api';

interface Props {
  doc: Document;
  onChat: (id: string) => void;
  onDelete: (id: string) => void;
}

function FileIcon({ type }: { type: string }) {
  if (type.includes('image')) return <FileImage className="w-4 h-4" />;
  if (type.includes('presentation') || type.includes('ppt')) return <Presentation className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'text-status-pending', icon: Clock, pulse: false },
  processing: { label: 'Processing', color: 'text-status-processing', icon: Loader2, pulse: true },
  ready: { label: 'Ready', color: 'text-status-ready', icon: CheckCircle2, pulse: false },
  failed: { label: 'Failed', color: 'text-status-failed', icon: XCircle, pulse: false },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function DocumentCard({ doc, onChat, onDelete }: Props) {
  const status = statusConfig[doc.status] ?? statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <motion.div
      layout
      className="group flex items-center gap-4 px-4 py-3.5 rounded-xl border border-bg-border hover:border-bg-elevated hover:bg-bg-surface/80 transition-all duration-150"
    >
      {/* Icon */}
      <div className="shrink-0 w-9 h-9 rounded-lg bg-bg-elevated flex items-center justify-center text-ink-muted group-hover:text-accent transition-colors">
        <FileIcon type={doc.file_type} />
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">{doc.name}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className={`flex items-center gap-1 text-xs ${status.color}`}>
            <StatusIcon className={`w-3 h-3 ${status.pulse ? 'animate-spin' : ''}`} />
            {status.label}
          </span>
          {doc.page_count && (
            <span className="text-xs text-ink-faint">{doc.page_count} pages</span>
          )}
          {doc.word_count && (
            <span className="text-xs text-ink-faint">{doc.word_count.toLocaleString()} words</span>
          )}
          <span className="text-xs text-ink-faint">{formatDate(doc.created_at)}</span>
        </div>
        {doc.status === 'failed' && doc.error_message && (
          <p className="text-xs text-status-failed mt-1 truncate">{doc.error_message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onChat(doc.id)}
          disabled={doc.status !== 'ready'}
          className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed px-2.5 py-1.5 rounded-lg hover:bg-accent/10 transition-all duration-150"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Chat
        </button>
        <button
          onClick={() => onDelete(doc.id)}
          className="text-ink-faint hover:text-status-failed p-1.5 rounded-lg hover:bg-status-failed/10 transition-all duration-150"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
