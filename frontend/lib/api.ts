import { getAuthToken } from './auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface Document {
  id: string;
  name: string;
  file_type: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  error_message?: string;
  page_count?: number;
  word_count?: number;
  created_at: string;
  processed_at?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  source_chunks: string[];
  created_at: string;
}

export interface ChunkSource {
  id: string;
  content: string;
  metadata: { page_number?: number };
  chunk_index: number;
  similarity: number;
}

async function authHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers ?? {}) },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Documents
  createDocument: (data: { storagePath: string; fileName: string; fileType: string }) =>
    request<{ id: string; status: string }>('/api/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listDocuments: () => request<Document[]>('/api/documents'),

  getDocument: (id: string) => request<Document>(`/api/documents/${id}`),

  deleteDocument: (id: string) =>
    request<{ success: boolean }>(`/api/documents/${id}`, { method: 'DELETE' }),

  // Chat
  getSessions: (documentId: string) =>
    request<Array<{ id: string; created_at: string }>>(`/api/chat/${documentId}/sessions`),

  getMessages: (documentId: string, sessionId: string) =>
    request<Message[]>(`/api/chat/${documentId}/sessions/${sessionId}/messages`),

  // Streaming chat — returns a ReadableStream
  async streamQuery(
    documentId: string,
    question: string,
    sessionId?: string
  ): Promise<Response> {
    const token = await getAuthToken();
    return fetch(`${BASE_URL}/api/chat/${documentId}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ question, sessionId }),
    });
  },
};
