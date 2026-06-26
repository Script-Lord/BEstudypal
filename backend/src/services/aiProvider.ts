type Role = 'user' | 'assistant' | 'system';
export interface ChatMessage { role: Role; content: string; }

export interface AIProvider {
  chat(messages: ChatMessage[]): Promise<string>;
  chatStream(messages: ChatMessage[], onChunk: (chunk: string) => void): Promise<void>;
}

import OpenAI from 'openai';

class OpenAIProvider implements AIProvider {
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER ?? 'openai';
  if (provider === 'openai') return new OpenAIProvider();
  throw new Error(`Unknown AI provider: ${provider}. Supported: openai`);
}
