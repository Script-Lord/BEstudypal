'use client';
import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, X, CheckCircle2, Loader2 } from 'lucide-react';
import { useUpload } from '../hooks/useUpload';
import { Button } from './ui/Button';

interface Props {
  userId: string;
  onDocumentQueued: (docId: string) => void;
}

export function DocumentUpload({ userId, onDocumentQueued }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { upload, state, progress, errorMsg, reset } = useUpload((id) => {
    onDocumentQueued(id);
    setTimeout(() => {
      reset();
      setSelectedFile(null);
    }, 2000);
  });

  const handleFile = (file: File) => {
    setSelectedFile(file);
    reset();
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const startUpload = () => {
    if (selectedFile) upload(selectedFile, userId);
  };

  const isIdle = state === 'idle';
  const isUploading = state === 'uploading';
  const isQueued = state === 'queued';

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.label
            key="dropzone"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            htmlFor="file-input"
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`
              flex flex-col items-center justify-center gap-3 w-full h-36
              border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
              ${dragOver
                ? 'border-accent bg-accent/5 scale-[1.01]'
                : 'border-bg-border hover:border-accent/40 hover:bg-bg-elevated/50'
              }
            `}
          >
            <UploadCloud
              className={`w-7 h-7 transition-colors ${dragOver ? 'text-accent' : 'text-ink-faint'}`}
            />
            <div className="text-center">
              <p className="text-sm text-ink-muted">
                Drop a file or <span className="text-accent">browse</span>
              </p>
              <p className="text-xs text-ink-faint mt-0.5">
                PDF, DOCX, PPTX, images, TXT — up to 50 MB
              </p>
            </div>
            <input
              id="file-input"
              type="file"
              className="hidden"
              accept=".pdf,.docx,.doc,.pptx,.ppt,.png,.jpg,.jpeg,.webp,.txt,.md"
              onChange={handleChange}
            />
          </motion.label>
        ) : (
          <motion.div
            key="file-selected"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-bg-elevated border border-bg-border"
          >
            <div className="shrink-0 w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
              {isQueued
                ? <CheckCircle2 className="w-4 h-4 text-status-ready" />
                : isUploading
                ? <Loader2 className="w-4 h-4 text-accent animate-spin" />
                : <FileText className="w-4 h-4 text-accent" />
              }
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink truncate">{selectedFile.name}</p>
              <p className="text-xs text-ink-faint">
                {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
              </p>
              {isUploading && (
                <div className="mt-1.5 h-1 w-full rounded-full bg-bg-border overflow-hidden">
                  <motion.div
                    className="h-full bg-accent rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
              {isQueued && (
                <p className="text-xs text-status-ready mt-0.5">Queued for processing</p>
              )}
              {errorMsg && (
                <p className="text-xs text-status-failed mt-0.5">{errorMsg}</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isIdle && !errorMsg && (
                <Button size="sm" onClick={startUpload}>Upload</Button>
              )}
              {(state === 'error' || isIdle) && (
                <button
                  onClick={() => { reset(); setSelectedFile(null); }}
                  className="text-ink-faint hover:text-ink transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
