'use client';
import { ReactNode, RefObject } from 'react';
import { AlertCircle, Globe, MoreHorizontal, RotateCcw, Send, SlidersHorizontal } from 'lucide-react';
import { MessageBubble } from '../MessageBubble';
import { CourseChatMsg } from '../../hooks/useCourseChat';

interface ChatPanelProps {
  title?: string;
  subtitle?: string;
  messages: CourseChatMsg[];
  streaming: boolean;
  error?: string | null;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onClear?: () => void;
  placeholder?: string;
  disabled?: boolean;
  suggestions?: string[];
  onSuggestion?: (text: string) => void;
  emptyState?: ReactNode;
  sourceCount?: number;
  webSearch?: boolean;
  onToggleWebSearch?: (value: boolean) => void;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  bottomRef?: RefObject<HTMLDivElement | null>;
}

export function ChatPanel({
  title = 'Chat',
  subtitle,
  messages,
  streaming,
  error,
  input,
  onInputChange,
  onSend,
  onClear,
  placeholder = 'Ask a question…',
  disabled = false,
  suggestions,
  onSuggestion,
  emptyState,
  sourceCount,
  webSearch = false,
  onToggleWebSearch,
  textareaRef,
  bottomRef,
}: ChatPanelProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-bg-border shrink-0">
        <div>
          <h2 className="text-sm font-medium text-ink">{title}</h2>
          {subtitle && <p className="text-xs text-ink-faint mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink px-2 py-1.5 rounded-lg hover:bg-bg-elevated transition-all mr-1"
            >
              <RotateCcw className="w-3 h-3" />
              New chat
            </button>
          )}
          <button
            type="button"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-bg-elevated transition-all"
            aria-label="Chat settings"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-bg-elevated transition-all"
            aria-label="More options"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {messages.length === 0 ? (
          emptyState ?? (
            <div className="flex flex-col items-center justify-center h-full min-h-[280px] gap-6">
              <div className="text-center">
                <p className="text-xl font-semibold text-ink mb-2">Ready to answer</p>
                <p className="text-sm text-ink-muted max-w-xs">Ask anything about your course materials.</p>
              </div>
              {suggestions && suggestions.length > 0 && onSuggestion && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {suggestions.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onSuggestion(s)}
                      className="text-left text-xs text-ink-muted border border-bg-border rounded-xl px-3.5 py-3 hover:border-secondary/40 hover:text-ink hover:bg-bg-elevated transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
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
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mx-5 mb-2 flex items-center gap-2 text-xs text-status-failed bg-status-failed/10 border border-status-failed/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="shrink-0 px-5 pb-5 pt-2">
        <div className="relative bg-bg-elevated border border-bg-border rounded-2xl px-4 py-3 focus-within:border-secondary/40 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={disabled || streaming}
            className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint resize-none outline-none leading-relaxed disabled:opacity-50 pr-16"
            style={{ minHeight: 24, maxHeight: 160 }}
          />

          {onToggleWebSearch && (
            <div className="flex items-center gap-2 mt-2 pr-12">
              <button
                type="button"
                onClick={() => onToggleWebSearch(!webSearch)}
                role="switch"
                aria-checked={webSearch}
                title={
                  webSearch
                    ? 'Web + AI is on — answers may add knowledge beyond your sources'
                    : 'Turn on Web + AI to expand answers beyond your sources'
                }
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
                  webSearch
                    ? 'bg-secondary-muted border-secondary/40 text-secondary'
                    : 'bg-bg-surface border-bg-border text-ink-faint hover:text-ink'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                Web + AI
                <span
                  className={`ml-0.5 w-7 h-3.5 rounded-full relative transition-colors ${
                    webSearch ? 'bg-secondary' : 'bg-bg-border'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${
                      webSearch ? 'left-[15px]' : 'left-0.5'
                    }`}
                  />
                </span>
              </button>
              <span className="text-[11px] text-ink-faint hidden sm:block">
                {webSearch ? 'Expands beyond your sources' : 'Stays within your sources'}
              </span>
            </div>
          )}

          <div className="absolute right-14 bottom-3 flex items-center gap-2 pointer-events-none">
            {sourceCount != null && sourceCount > 0 && (
              <span className="text-[11px] text-ink-faint">{sourceCount} sources</span>
            )}
          </div>
          <button
            type="button"
            onClick={onSend}
            disabled={!input.trim() || streaming || disabled}
            className="absolute right-3 bottom-2.5 w-8 h-8 rounded-full bg-secondary hover:bg-secondary-hover disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-lg shadow-secondary/25"
          >
            {streaming ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
