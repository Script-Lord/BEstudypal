import {
  deleteChunksFromRedis,
  searchChunksInRedis,
  searchCourseChunksInRedis,
  storeChunksInRedis,
} from './chunkStore';

export interface ChunkResult {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  chunk_index: number;
  similarity: number;
  document_id?: string;
}

export async function searchSimilarChunks(
  _queryEmbedding: number[],
  documentId: string,
  _userId: string,
  topK = 5,
  queryText = ''
): Promise<ChunkResult[]> {
  return searchChunksInRedis(documentId, topK, queryText);
}

export async function searchChunksInCourse(
  courseId: string,
  topK = 8,
  queryText = ''
): Promise<ChunkResult[]> {
  return searchCourseChunksInRedis(courseId, topK, queryText);
}

export async function storeChunks(
  documentId: string,
  userId: string,
  chunks: string[],
  _embeddings: number[][],
  pages: Array<{ page_number: number; text: string }>,
  courseId?: string | null
): Promise<void> {
  await storeChunksInRedis(documentId, userId, chunks, pages, courseId);
}

export async function removeChunks(
  documentId: string,
  courseId?: string | null
): Promise<void> {
  await deleteChunksFromRedis(documentId, courseId);
}
