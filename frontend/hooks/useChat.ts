'use client';
import { useState, useCallback, useRef } from 'react';
import { api, ChunkSource } from '../lib/api';

export interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChunkSource[];
  streaming?: boolean;
}

export function useChat(documentId: string) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (question: string) => {
    if (streaming) return;

    const userMsg: ChatMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: question,
    };
    const assistantId = `a-${Date.now()}`;
    const assistantMsg: ChatMsg = {
      id: assistantId,
      role: 'assistant',
      content: '',
      streaming: true,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setStreaming(true);
    setError(null);

    abortRef.current = new AbortController();

    try {
      const res = await api.streamQuery(documentId, question, sessionId);

      if (!res.ok || !res.body) {
        throw new Error(`Request failed: ${res.status}`);
      }

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
            const payload = JSON.parse(raw);

            if (payload.chunk) {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId
                    ? { ...m, content: m.content + payload.chunk }
                    : m
                )
              );
            }

            if (payload.done) {
              if (payload.sessionId) setSessionId(payload.sessionId);
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId
                    ? { ...m, streaming: false, sources: payload.sources ?? [] }
                    : m
                )
              );
            }

            if (payload.error) {
              setError(payload.error);
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: 'Sorry, something went wrong.', streaming: false }
                  : m
              ));
            }
          } catch {
            // Ignore malformed SSE lines
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Network error');
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: 'Failed to get a response.', streaming: false }
            : m
        ));
      }
    } finally {
      setStreaming(false);
    }
  }, [documentId, sessionId, streaming]);

  const loadHistory = useCallback(async (sid: string) => {
    const msgs = await api.getMessages(documentId, sid);
    setSessionId(sid);
    setMessages(msgs.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
    })));
  }, [documentId]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(undefined);
  }, []);

  return { messages, streaming, error, sessionId, sendMessage, loadHistory, clearChat };
}
