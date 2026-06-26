'use client';
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

const BUCKET = 'documents';
const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'text/markdown',
]);

export type UploadState = 'idle' | 'uploading' | 'queued' | 'error';

export function useUpload(onSuccess: (docId: string) => void) {
  const [state, setState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const upload = useCallback(async (file: File, userId: string) => {
    setErrorMsg(null);

    if (!ALLOWED_TYPES.has(file.type)) {
      setErrorMsg(`File type not supported: ${file.type}`);
      return;
    }
    if (file.size > MAX_SIZE) {
      setErrorMsg('File too large (max 50 MB)');
      return;
    }

    setState('uploading');
    setProgress(10);

    const ext = file.name.split('.').pop() ?? 'bin';
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data: storageData, error: storageError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false });

    if (storageError || !storageData) {
      setState('error');
      setErrorMsg(storageError?.message ?? 'Upload failed');
      return;
    }

    setProgress(60);

    try {
      const { id } = await api.createDocument({
        storagePath: storageData.path,
        fileName: file.name,
        fileType: file.type,
      });

      setProgress(100);
      setState('queued');
      onSuccess(id);
    } catch (err) {
      setState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to queue document');
    }
  }, [onSuccess]);

  const reset = useCallback(() => {
    setState('idle');
    setProgress(0);
    setErrorMsg(null);
  }, []);

  return { upload, state, progress, errorMsg, reset };
}
