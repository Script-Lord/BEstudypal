/**
 * Snwolley API wrapper
 *
 * Team key  (STT / TTS / Vision) → SNWOLLEY_HACKATHON_API_KEY   header: X-API-Key
 * Platform key (Agents / Chat)   → SNWOLLEY_AGENT_API_KEY        header: X-APIKey
 */
import axios from 'axios';
import FormData from 'form-data';

const BASE = 'https://v1.snwolley.ai';

function teamKey() {
  const k = process.env.SNWOLLEY_HACKATHON_API_KEY;
  if (!k) throw new Error('SNWOLLEY_HACKATHON_API_KEY is not set');
  return k;
}

function agentKey() {
  const k = process.env.SNWOLLEY_AGENT_API_KEY;
  if (!k) throw new Error('SNWOLLEY_AGENT_API_KEY is not set');
  return k;
}

// ─── Speech-to-Text ──────────────────────────────────────────────────────────

export async function transcribeAudio(
  audioBuffer: Buffer,
  filename = 'audio.webm'
): Promise<string> {
  const form = new FormData();
  form.append('file', audioBuffer, { filename, contentType: 'audio/webm' });

  const { data } = await axios.post<{ text: string }>(
    `${BASE}/api/v1/hackathon/stt`,
    form,
    {
      headers: {
        ...form.getHeaders(),
        'X-API-Key': teamKey(),
      },
      timeout: 60_000,
    }
  );

  return data.text ?? '';
}

// ─── Text-to-Speech ──────────────────────────────────────────────────────────

export async function synthesizeSpeech(text: string): Promise<Buffer> {
  const { data } = await axios.post(
    `${BASE}/api/v1/hackathon/tts`,
    { text },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': teamKey(),
      },
      responseType: 'arraybuffer',
      timeout: 60_000,
    }
  );

  return Buffer.from(data);
}

// ─── Vision ──────────────────────────────────────────────────────────────────

export async function describeImageBuffer(
  imageBuffer: Buffer,
  filename: string
): Promise<string> {
  const form = new FormData();
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  form.append('image', imageBuffer, { filename, contentType: mime });

  const { data } = await axios.post<{ description?: string; text?: string; result?: string }>(
    `${BASE}/api/v1/hackathon/vision`,
    form,
    {
      headers: {
        ...form.getHeaders(),
        'X-API-Key': teamKey(),
      },
      timeout: 120_000,
    }
  );

  return data.description ?? data.text ?? data.result ?? '';
}

export async function describeImageUrl(imageUrl: string): Promise<string> {
  const { data } = await axios.post<{ description?: string; text?: string; result?: string }>(
    `${BASE}/api/v1/hackathon/vision`,
    { image_url: imageUrl },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': teamKey(),
      },
      timeout: 120_000,
    }
  );

  return data.description ?? data.text ?? data.result ?? '';
}

// ─── Agents (Chat Completions) ────────────────────────────────────────────────

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentResponse {
  reply: string;
  chatId: string;
}

/**
 * Single-turn or multi-turn agent call.
 * Pass chatId from a prior response to continue the conversation thread.
 */
export async function callAgent(
  message: string,
  chatId?: string,
  agentId = process.env.SNWOLLEY_AGENT_ID ?? '107'
): Promise<AgentResponse> {
  const payload: Record<string, unknown> = { message, agent: agentId };
  if (chatId) payload.chat_id = chatId;

  const { data } = await axios.post<Record<string, unknown>>(
    `${BASE}/v1/chat/completions`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-APIKey': agentKey(),
      },
      timeout: 120_000,
    }
  );

  // The Snwolley response may use "message" or the OpenAI-compatible shape
  const reply =
    (data.message as string) ??
    (data as { choices?: Array<{ message: { content: string } }> }).choices?.[0]?.message?.content ??
    '';

  const returnedChatId =
    (data.chat_id as string) ??
    (data.id as string) ??
    chatId ??
    '';

  return { reply, chatId: returnedChatId };
}
