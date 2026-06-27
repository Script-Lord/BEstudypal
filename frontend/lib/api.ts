import { getAuthToken } from './auth';
import {
  getPublicCourseFromSupabase,
  isSupabaseConfigured,
  listPublicCoursesFromSupabase,
} from './publicCourses';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

// ── Types ─────────────────────────────────────────────────────────────────────

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
  course_id?: string;
}

export interface Course {
  id: string;
  title: string;
  code: string;
  level: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  doc_count: number;
  author?: string;        // public browse only
}

export interface PublicCourse extends Course {
  documents: Document[];
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
  document_id?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
    const message = (body as { error?: string }).error;
    if (res.status === 429) {
      throw new Error(message ?? 'Too many requests — please wait a moment and try again.');
    }
    throw new Error(message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function publicRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = (body as { error?: string }).error;
    if (res.status === 429) {
      throw new Error(message ?? 'Too many requests — please wait a moment and try again.');
    }
    throw new Error(message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const api = {
  // ── Documents ──────────────────────────────────────────────────────────────
  createDocument: (data: { storagePath: string; fileName: string; fileType: string; courseId?: string }) =>
    request<{ id: string; status: string }>('/api/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createWebSource: (data: { url: string; courseId: string }) =>
    request<{ id: string; status: string }>('/api/documents/web-source', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listDocuments: () => request<Document[]>('/api/documents'),

  getDocument: (id: string) => request<Document>(`/api/documents/${id}`),

  deleteDocument: (id: string) =>
    request<{ success: boolean }>(`/api/documents/${id}`, { method: 'DELETE' }),

  // ── Courses (authenticated) ─────────────────────────────────────────────────
  createCourse: (data: { title: string; code: string; level: string; description?: string; is_public: boolean }) =>
    request<Course>('/api/courses', { method: 'POST', body: JSON.stringify(data) }),

  listCourses: () => request<Course[]>('/api/courses'),

  getCourse: (id: string) => request<Course>(`/api/courses/${id}`),

  getCourseDocuments: (id: string) => request<Document[]>(`/api/courses/${id}/documents`),

  updateCourse: (id: string, data: Partial<{ title: string; code: string; level: string; description: string; is_public: boolean }>) =>
    request<Course>(`/api/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteCourse: (id: string) =>
    request<{ success: boolean }>(`/api/courses/${id}`, { method: 'DELETE' }),

  // ── Public browse (no auth) ─────────────────────────────────────────────────
  async listPublicCourses(): Promise<Course[]> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const courses = await publicRequest<Course[]>('/api/public/courses', { signal: controller.signal });
        return courses.map(c => ({ ...c, is_public: c.is_public ?? true }));
      } finally {
        clearTimeout(timeout);
      }
    } catch (err) {
      if (!isSupabaseConfigured()) throw err;
      return listPublicCoursesFromSupabase();
    }
  },

  async getPublicCourse(id: string): Promise<PublicCourse> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        return await publicRequest<PublicCourse>(`/api/public/courses/${id}`, { signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
    } catch (err) {
      if (!isSupabaseConfigured()) throw err;
      return getPublicCourseFromSupabase(id);
    }
  },

  // ── Chat: document-level (auth) ─────────────────────────────────────────────
  getSessions: (documentId: string) =>
    request<Array<{ id: string; created_at: string }>>(`/api/chat/${documentId}/sessions`),

  getMessages: (documentId: string, sessionId: string) =>
    request<Message[]>(`/api/chat/${documentId}/sessions/${sessionId}/messages`),

  async streamDocumentQuery(documentId: string, question: string, sessionId?: string): Promise<Response> {
    const token = await getAuthToken();
    return fetch(`${BASE_URL}/api/chat/${documentId}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ question, sessionId }),
    });
  },

  // ── Chat: course-level (auth, owner) ────────────────────────────────────────
  async streamCourseQuery(courseId: string, question: string, webSearch = false): Promise<Response> {
    const token = await getAuthToken();
    return fetch(`${BASE_URL}/api/courses/${courseId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ question, webSearch }),
    });
  },

  // ── Chat: public course-level (no auth) ─────────────────────────────────────
  streamPublicCourseQuery(courseId: string, question: string, webSearch = false): Promise<Response> {
    return fetch(`${BASE_URL}/api/public/courses/${courseId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, webSearch }),
    });
  },

  // legacy alias kept so existing ChatWindow still compiles
  async streamQuery(documentId: string, question: string, sessionId?: string): Promise<Response> {
    return this.streamDocumentQuery(documentId, question, sessionId);
  },

  // ── Voice (STT via Snwolley on backend) ─────────────────────────────────────
  async transcribeAudio(audio: Blob, filename = 'audio.webm'): Promise<{ text: string }> {
    const token = await getAuthToken();
    const form = new FormData();
    form.append('audio', audio, filename);
    const res = await fetch(`${BASE_URL}/api/voice/stt`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<{ text: string }>;
  },
};
