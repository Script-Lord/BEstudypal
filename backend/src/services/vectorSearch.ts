import { pool } from '../db/client';

export interface ChunkResult {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  chunk_index: number;
  similarity: number;
}

export async function searchSimilarChunks(
  queryEmbedding: number[],
  documentId: string,
  userId: string,
  topK = 5
): Promise<ChunkResult[]> {
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  const result = await pool.query<ChunkResult>(
    `SELECT
       id,
       content,
       metadata,
       chunk_index,
       1 - (embedding <=> $1::vector) AS similarity
     FROM chunks
     WHERE document_id = $2
       AND user_id = $3
       AND embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $4`,
    [embeddingStr, documentId, userId, topK]
  );

  return result.rows;
}

export async function storeChunks(
  documentId: string,
  userId: string,
  chunks: string[],
  embeddings: number[][],
  pages: Array<{ page_number: number; text: string }>
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (let i = 0; i < chunks.length; i++) {
      const embedding = embeddings[i];
      const embeddingStr = `[${embedding.join(',')}]`;

      // Determine approximate page number
      const pageNum = pages.length > 0
        ? Math.floor((i / chunks.length) * pages.length) + 1
        : null;

      await client.query(
        `INSERT INTO chunks (document_id, user_id, content, metadata, embedding, chunk_index)
         VALUES ($1, $2, $3, $4, $5::vector, $6)`,
        [
          documentId,
          userId,
          chunks[i],
          JSON.stringify({ page_number: pageNum }),
          embeddingStr,
          i,
        ]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
