'use client';
import { useState, useEffect, useCallback } from 'react';
import { api, Document } from '../lib/api';

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const docs = await api.listDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const deleteDocument = useCallback(async (id: string) => {
    await api.deleteDocument(id);
    setDocuments(prev => prev.filter(d => d.id !== id));
  }, []);

  return { documents, loading, error, refresh, deleteDocument };
}

export function useDocumentStatus(docId: string, initialStatus: string) {
  const [status, setStatus] = useState(initialStatus);
  const [doc, setDoc] = useState<Document | null>(null);

  useEffect(() => {
    if (status === 'ready' || status === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const d = await api.getDocument(docId);
        setDoc(d);
        setStatus(d.status);
        if (d.status === 'ready' || d.status === 'failed') {
          clearInterval(interval);
        }
      } catch {
        // Ignore transient errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [docId, status]);

  return { status, doc };
}
