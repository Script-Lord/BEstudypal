import OpenAI from 'openai';
import { callAgent } from './snwolley';

type Role = 'user' | 'assistant' | 'system';
export interface ChatMessage { role: Role; content: string; }

export interface AIProvider {
  chat(messages: ChatMessage[]): Promise<string>;
  chatStream(messages: ChatMessage[], onChunk: (chunk: string) => void): Promise<void>;
}

// ─── OpenAI ──────────────────────────────────────────────────────────────────

class OpenAIProvider implements AIProvider {
  private get client() {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('OPENAI_API_KEY is not set. Switch AI_PROVIDER=snwolley or add the key.');
    return new OpenAI({ apiKey: key });
  }
  private model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  async chat(messages: ChatMessage[]): Promise<string> {
    const res = await this.client.chat.completions.create({ model: this.model, messages });
    return res.choices[0].message.content ?? '';
  }

  async chatStream(messages: ChatMessage[], onChunk: (chunk: string) => void): Promise<void> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages,
      stream: true,
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) onChunk(delta);
    }
  }
}

// ─── Gemini (OpenAI-compatible endpoint) ──────────────────────────────────────
// Google exposes an OpenAI-compatible API, so we reuse the OpenAI SDK and just
// point it at Gemini's base URL.

class GeminiProvider implements AIProvider {
  private get client() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is not set. Add the key or switch AI_PROVIDER.');
    return new OpenAI({
      apiKey: key,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    });
  }
  private model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';

  async chat(messages: ChatMessage[]): Promise<string> {
    const res = await this.client.chat.completions.create({ model: this.model, messages });
    return res.choices[0].message.content ?? '';
  }

  async chatStream(messages: ChatMessage[], onChunk: (chunk: string) => void): Promise<void> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages,
      stream: true,
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) onChunk(delta);
    }
  }
}

// ─── Snwolley Agents ─────────────────────────────────────────────────────────
// The Agents API is not streaming, so chatStream emits the full reply in one
// chunk. chat_id continuity is handled per-session via the snwolleySessionMap.

const snwolleySessionMap = new Map<string, string>();

class SnwolleyProvider implements AIProvider {
  /**
   * Flatten the message array into a single prompt that embeds the system
   * context (document excerpts) directly into the user message, since the
   * Snwolley Agents API accepts a single `message` string.
   */
  private buildPrompt(messages: ChatMessage[]): { prompt: string; sessionHint?: string } {
    const system = messages.find(m => m.role === 'system')?.content ?? '';
    const history = messages.filter(m => m.role !== 'system');
    const last = history[history.length - 1];

    const historyBlock = history
      .slice(0, -1)
      .map(m => `${m.role === 'user' ? 'Student' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const prompt = [
      system,
      historyBlock ? `\nConversation so far:\n${historyBlock}` : '',
      `\nStudent: ${last?.content ?? ''}`,
    ]
      .filter(Boolean)
      .join('\n');

    return { prompt };
  }

  async chat(messages: ChatMessage[], chatId?: string): Promise<string> {
    const { prompt } = this.buildPrompt(messages);
    const { reply, chatId: newChatId } = await callAgent(prompt, chatId);
    if (newChatId) snwolleySessionMap.set(chatId ?? newChatId, newChatId);
    return reply;
  }

  async chatStream(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    chatId?: string
  ): Promise<void> {
    const reply = await this.chat(messages, chatId);
    // Emit in word-sized chunks so the frontend streaming UI feels natural
    const words = reply.split(' ');
    for (const word of words) {
      onChunk(word + ' ');
      await new Promise(r => setTimeout(r, 12));
    }
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER ?? 'openai';
  if (provider === 'openai') return new OpenAIProvider();
  if (provider === 'gemini') return new GeminiProvider();
  if (provider === 'snwolley') return new SnwolleyProvider();
  throw new Error(`Unknown AI provider: ${provider}. Supported: openai, gemini, snwolley`);
}

export { snwolleySessionMap };
