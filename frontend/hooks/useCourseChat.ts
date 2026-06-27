'use client';
import { useState, useCallback } from 'react';
import { api, ChunkSource } from '../lib/api';

export interface CourseChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChunkSource[];
  streaming?: boolean;
}

export function useCourseChat(courseId: string, isPublic = false) {
  const [messages, setMessages] = useState<CourseChatMsg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (question: string, webSearch = false) => {
    if (streaming) return;

    const userMsg: CourseChatMsg = { id: `u-${Date.now()}`, role: 'user', content: question };
    const assistantId = `a-${Date.now()}`;
    const assistantMsg: CourseChatMsg = { id: assistantId, role: 'assistant', content: '', streaming: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setStreaming(true);
    setError(null);

    try {
      const res = isPublic
        ? await api.streamPublicCourseQuery(courseId, question, webSearch)
        : await api.streamCourseQuery(courseId, question, webSearch);

      if (!res.ok || !res.body) throw new Error(`Request failed: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const payload = JSON.parse(raw) as { chunk?: string; done?: boolean; sources?: ChunkSource[]; error?: string };

            if (payload.chunk) {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: m.content + payload.chunk } : m
              ));
            }
            if (payload.done) {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, streaming: false, sources: payload.sources ?? [] } : m
              ));
            }
            if (payload.error) {
              setError(payload.error);
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: 'Sorry, something went wrong.', streaming: false } : m
              ));
            }
          } catch { /* ignore malformed lines */ }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: 'Failed to get a response.', streaming: false } : m
      ));
    } finally {
      setStreaming(false);
    }
  }, [courseId, isPublic, streaming]);

  const clearChat = useCallback(() => setMessages([]), []);

  return { messages, streaming, error, sendMessage, clearChat };
}
