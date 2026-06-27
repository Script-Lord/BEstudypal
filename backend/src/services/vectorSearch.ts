import { pool } from '../db/client';

export interface ChunkResult {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  chunk_index: number;
  similarity: number;
}

/**
 * Full-text search over stored chunks.
 * Uses PostgreSQL tsvector/tsquery — no pgvector or OpenAI key required.
 */
export async function searchSimilarChunks(
  _queryEmbedding: number[],   // unused — kept for API compatibility
  documentId: string,
  userId: string,
  topK = 5,
  queryText = ''               // raw question text for FTS
): Promise<ChunkResult[]> {
  // If a query text is available use ranked FTS; otherwise return top chunks.
  if (queryText.trim()) {
    const result = await pool.query<ChunkResult>(
      `SELECT
         id,
         content,
         metadata,
         chunk_index,
         ts_rank(
           to_tsvector('english', content),
           plainto_tsquery('english', $1)
         ) AS similarity
       FROM chunks
       WHERE document_id = $2
         AND user_id = $3
         AND to_tsvector('english', content) @@ plainto_tsquery('english', $1)
       ORDER BY similarity DESC
       LIMIT $4`,
      [queryText, documentId, userId, topK]
    );

    // Fall back to first N chunks if FTS returns nothing (e.g. single-word query)
    if (result.rows.length > 0) return result.rows;
  }

  const fallback = await pool.query<ChunkResult>(
    `SELECT id, content, metadata, chunk_index, 1.0 AS similarity
     FROM chunks
     WHERE document_id = $1 AND user_id = $2
     ORDER BY chunk_index ASC
     LIMIT $3`,
    [documentId, userId, topK]
  );

  return fallback.rows;
}

/**
 * Store chunks in the database.
 * The embedding column is left NULL — pgvector is still present but unused.
 */
export async function storeChunks(
  documentId: string,
  userId: string,
  chunks: string[],
  _embeddings: number[][],   // unused
  pages: Array<{ page_number: number; text: string }>
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (let i = 0; i < chunks.length; i++) {
      const pageNum = pages.length > 0
        ? Math.floor((i / chunks.length) * pages.length) + 1
        : null;

      await client.query(
        `INSERT INTO chunks (document_id, user_id, content, metadata, chunk_index)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          documentId,
          userId,
          chunks[i],
          JSON.stringify({ page_number: pageNum }),
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
