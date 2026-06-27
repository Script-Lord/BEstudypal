'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, RotateCcw, AlertCircle } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { MessageBubble } from './MessageBubble';

interface Props {
  documentId: string;
  documentName: string;
}

const SUGGESTIONS = [
  'Summarize the key points of this document',
  'What are the main conclusions?',
  'List the most important facts',
  'What questions does this document answer?',
];

export function ChatWindow({ documentId, documentName }: Props) {
  const { messages, streaming, error, sendMessage, clearChat } = useChat(documentId);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const q = input.trim();
    if (!q || streaming) return;
    setInput('');
    sendMessage(q);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-bg-border shrink-0">
        <div>
          <h2 className="text-sm font-medium text-ink">Chat</h2>
          <p className="text-xs text-ink-faint mt-0.5">{documentName}</p>
        </div>
        {!isEmpty && (
          <button
            onClick={clearChat}
            className="text-ink-faint hover:text-ink flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg hover:bg-bg-elevated transition-all"
          >
            <RotateCcw className="w-3 h-3" />
            New chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        <AnimatePresence>
          {isEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full min-h-[300px] gap-6"
            >
              <div className="text-center">
                <p className="text-2xl font-semibold text-ink mb-2">Ready to answer</p>
                <p className="text-sm text-ink-muted max-w-xs">
                  Ask any question about <span className="text-ink">{documentName}</span>
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-left text-xs text-ink-muted border border-bg-border rounded-xl px-3.5 py-3 hover:border-accent/40 hover:text-ink hover:bg-bg-elevated transition-all duration-150"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            messages.map(msg => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                sources={msg.sources}
                streaming={msg.streaming}
              />
            ))
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mb-2 flex items-center gap-2 text-xs text-status-failed bg-status-failed/10 border border-status-failed/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 px-6 pb-6 pt-2">
        <div className="flex items-end gap-3 input-surface px-4 py-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            rows={1}
            disabled={streaming}
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint resize-none outline-none leading-relaxed disabled:opacity-50"
            style={{ minHeight: '24px', maxHeight: '160px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || streaming}
            className="shrink-0 w-8 h-8 rounded-full bg-accent hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all duration-150 shadow-glow"
          >
            {streaming ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
        <p className="text-center text-xs text-ink-faint mt-2">
          Answers are grounded in your document. Always verify important information.
        </p>
      </div>
    </div>
  );
}
