/**
 * Text chunking — no external embedding API needed.
 * Similarity search uses PostgreSQL full-text search (tsvector/tsquery).
 */

const CHUNK_CHARS = 512 * 4;   // ~512 tokens × 4 chars/token
const OVERLAP_CHARS = 50 * 4;  // ~50 token overlap

export function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + CHUNK_CHARS, text.length);

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

// Kept for API compatibility with documentWorker — returns empty arrays since
// we use full-text search instead of vector similarity.
export async function generateEmbedding(_text: string): Promise<number[]> {
  return [];
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  return texts.map(() => []);
}
