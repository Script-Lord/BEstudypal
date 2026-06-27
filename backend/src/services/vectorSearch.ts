import { pool } from '../db/client';

export interface ChunkResult {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  chunk_index: number;
  similarity: number;
  document_id?: string;
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
 * Full-text search across ALL ready documents in a course.
 * Used for course-level chat (owner + public visitors).
 */
export async function searchChunksInCourse(
  courseId: string,
  topK = 8,
  queryText = ''
): Promise<ChunkResult[]> {
  if (queryText.trim()) {
    const result = await pool.query<ChunkResult>(
      `SELECT c.id, c.content, c.metadata, c.chunk_index, c.document_id,
         ts_rank(
           to_tsvector('english', c.content),
           plainto_tsquery('english', $1)
         ) AS similarity
       FROM chunks c
       JOIN documents d ON d.id = c.document_id
       WHERE d.course_id = $2
         AND d.status = 'ready'
         AND to_tsvector('english', c.content) @@ plainto_tsquery('english', $1)
       ORDER BY similarity DESC
       LIMIT $3`,
      [queryText, courseId, topK]
    );
    if (result.rows.length > 0) return result.rows;
  }

  // Fallback: first N chunks ordered by document + position
  const fallback = await pool.query<ChunkResult>(
    `SELECT c.id, c.content, c.metadata, c.chunk_index, c.document_id, 1.0 AS similarity
     FROM chunks c
     JOIN documents d ON d.id = c.document_id
     WHERE d.course_id = $1 AND d.status = 'ready'
     ORDER BY c.document_id, c.chunk_index ASC
     LIMIT $2`,
    [courseId, topK]
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
  if (chunks.length === 0) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const values: unknown[] = [];
    const rows: string[] = [];
    let paramIdx = 1;

    for (let i = 0; i < chunks.length; i++) {
      const pageNum = pages.length > 0
        ? Math.floor((i / chunks.length) * pages.length) + 1
        : null;

      rows.push(
        `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`
      );
      values.push(
        documentId,
        userId,
        chunks[i],
        JSON.stringify({ page_number: pageNum }),
        i
      );
    }

    await client.query(
      `INSERT INTO chunks (document_id, user_id, content, metadata, chunk_index)
       VALUES ${rows.join(', ')}`,
      values
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
