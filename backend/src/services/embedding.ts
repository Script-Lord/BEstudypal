import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CHUNK_CHARS = 512 * 4;   // ~512 tokens × 4 chars/token
const OVERLAP_CHARS = 50 * 4;  // ~50 token overlap

export function chunkText(text: string): string[] {
  // Prefer splitting on paragraph or sentence boundaries
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + CHUNK_CHARS, text.length);

    // Try to snap to a paragraph boundary within the last 20% of the chunk
    if (end < text.length) {
      const searchStart = start + Math.floor(CHUNK_CHARS * 0.8);
      const slice = text.slice(searchStart, end);
      const paraBreak = slice.lastIndexOf('\n\n');
      const sentBreak = slice.lastIndexOf('. ');

      if (paraBreak !== -1) {
        end = searchStart + paraBreak + 2;
      } else if (sentBreak !== -1) {
        end = searchStart + sentBreak + 2;
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 50) chunks.push(chunk);

    start = end - OVERLAP_CHARS;
  }

  return chunks;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000),
  });
  return response.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100).map(t => t.slice(0, 8000));
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    });
    results.push(...response.data.map(d => d.embedding));
  }

  return results;
}
