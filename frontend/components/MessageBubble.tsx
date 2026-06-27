'use client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { ChunkSource } from '../lib/api';

interface Props {
  role: 'user' | 'assistant';
  content: string;
  sources?: ChunkSource[];
  streaming?: boolean;
}

export function MessageBubble({ role, content, sources, streaming }: Props) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`
          shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5
          ${isUser ? 'bg-accent text-white' : 'bg-accent-muted text-accent border border-accent/20'}
        `}
      >
        {isUser ? 'U' : 'AI'}
      </div>

      {/* Bubble */}
      <div className={`flex-1 min-w-0 max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        <div
          className={`
            px-4 py-3 rounded-2xl text-sm leading-relaxed
            ${isUser
              ? 'bg-accent text-white rounded-tr-sm shadow-sm'
              : 'bg-bg-elevated border border-bg-border rounded-tl-sm text-ink'
            }
          `}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="prose dark:prose-invert prose-sm max-w-none
              prose-p:my-1 prose-p:leading-relaxed
              prose-headings:text-ink prose-headings:font-semibold
              prose-code:bg-bg-elevated prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:text-ink
              prose-pre:bg-bg-base prose-pre:border prose-pre:border-bg-border
              prose-blockquote:border-accent/40 prose-blockquote:text-ink-muted
              prose-a:text-accent prose-a:no-underline hover:prose-a:underline
              prose-strong:text-ink
              prose-li:my-0.5
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content || (streaming ? '▋' : '')}
              </ReactMarkdown>
            </div>
          )}
          {streaming && !isUser && content.length === 0 && (
            <span className="inline-block w-2 h-4 bg-ink-muted rounded-sm animate-pulse" />
          )}
        </div>

        {/* Source references */}
        {sources && sources.length > 0 && !streaming && (
          <div className="flex flex-wrap gap-1.5">
            {sources.map((src, i) => (
              <SourceBadge key={src.id} index={i + 1} source={src} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SourceBadge({ index, source }: { index: number; source: ChunkSource }) {
  return (
    <div className="group relative">
      <button className="text-xs text-accent bg-accent/10 hover:bg-accent/20 border border-accent/20 px-2 py-0.5 rounded-md transition-colors">
        Source {index}
        {source.metadata?.page_number && (
          <span className="text-ink-faint ml-1">· p.{source.metadata.page_number}</span>
        )}
      </button>
      {/* Tooltip */}
      <div className="hidden group-hover:block absolute bottom-full left-0 mb-1 z-50 w-72 p-3 text-xs rounded-lg bg-bg-elevated border border-bg-border shadow-xl text-ink-muted leading-relaxed">
        <p className="font-medium text-ink mb-1">Excerpt</p>
        <p className="line-clamp-4">{source.content}</p>
        <p className="mt-1 text-ink-faint">
          Similarity: {(source.similarity * 100).toFixed(0)}%
        </p>
      </div>
    </div>
  );
}
