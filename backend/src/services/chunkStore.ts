import { v4 as uuidv4 } from 'uuid';
import { redis } from '../db/redis';

export interface StoredChunk {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  chunk_index: number;
  document_id?: string;
}

const CHUNKS_KEY = (docId: string) => `chunks:${docId}`;
const COURSE_DOCS_KEY = (courseId: string) => `course:${courseId}:docs`;

function scoreChunk(content: string, query: string): number {
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return 0;

  const lower = content.toLowerCase();
  let hits = 0;
  for (const word of words) {
    if (lower.includes(word)) hits++;
  }
  return hits / words.length;
}

export async function storeChunksInRedis(
  documentId: string,
  userId: string,
  chunks: string[],
  pages: Array<{ page_number: number; text: string }>,
  courseId?: string | null
): Promise<void> {
  const stored: StoredChunk[] = chunks.map((content, i) => {
    const pageNum = pages.length > 0
      ? Math.floor((i / chunks.length) * pages.length) + 1
      : null;

    return {
      id: uuidv4(),
      content,
      metadata: { page_number: pageNum, user_id: userId },
      chunk_index: i,
      document_id: documentId,
    };
  });

  await redis.set(CHUNKS_KEY(documentId), JSON.stringify(stored));

  if (courseId) {
    await redis.sadd(COURSE_DOCS_KEY(courseId), documentId);
  }

  console.log(`[Redis] Stored ${stored.length} chunks for doc ${documentId}`);
}

export async function searchChunksInRedis(
  documentId: string,
  topK = 5,
  queryText = ''
): Promise<Array<StoredChunk & { similarity: number }>> {
  const raw = await redis.get(CHUNKS_KEY(documentId));
  if (!raw) return [];

  const chunks = JSON.parse(raw) as StoredChunk[];

  if (queryText.trim()) {
    const ranked = chunks
      .map((c) => ({ ...c, similarity: scoreChunk(c.content, queryText) }))
      .filter((c) => c.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    if (ranked.length > 0) return ranked;
  }

  return chunks.slice(0, topK).map((c) => ({ ...c, similarity: 1.0 }));
}

export async function searchCourseChunksInRedis(
  courseId: string,
  topK = 8,
  queryText = ''
): Promise<Array<StoredChunk & { similarity: number }>> {
  const docIds = await redis.smembers(COURSE_DOCS_KEY(courseId));
  if (docIds.length === 0) return [];

  const all: Array<StoredChunk & { similarity: number }> = [];

  for (const docId of docIds) {
    const hits = await searchChunksInRedis(docId, topK, queryText);
    all.push(...hits);
  }

  if (queryText.trim()) {
    return all
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  return all.slice(0, topK);
}

export async function deleteChunksFromRedis(
  documentId: string,
  courseId?: string | null
): Promise<void> {
  await redis.del(CHUNKS_KEY(documentId));
  if (courseId) {
    await redis.srem(COURSE_DOCS_KEY(courseId), documentId);
  }
}
