import { pool } from '../db/client';
import { downloadFromStorage } from './storage';
import { parseDocument } from './docProcessor';
import { chunkText, generateEmbeddings } from './embedding';
import { storeChunks } from './vectorSearch';

export interface DocumentJobData {
  documentId: string;
  userId: string;
  storagePath: string;
  fileName: string;
}

async function updateDocumentStatus(
  id: string,
  status: string,
  extra: Record<string, unknown> = {}
) {
  const setClauses = ['status = $2'];
  const values: unknown[] = [id, status];
  let idx = 3;

  for (const [key, val] of Object.entries(extra)) {
    setClauses.push(`${key} = $${idx++}`);
    values.push(val);
  }

  await pool.query(
    `UPDATE documents SET ${setClauses.join(', ')} WHERE id = $1`,
    values
  );
}

export async function processDocumentJob(data: DocumentJobData): Promise<void> {
  const { documentId, userId, storagePath, fileName } = data;

  console.log(`[Process] Starting doc ${documentId}`);
  await updateDocumentStatus(documentId, 'processing');

  const fileBuffer = await downloadFromStorage(storagePath);

  const parseStart = Date.now();
  const { markdown, pages } = await parseDocument(fileBuffer, fileName);
  console.log(`[Process] Parsed ${fileName} in ${Date.now() - parseStart}ms`);

  if (!markdown || markdown.trim().length === 0) {
    throw new Error('Document parser returned empty content');
  }

  const chunks = chunkText(markdown);
  console.log(`[Process] ${chunks.length} chunks from ${markdown.length} chars`);

  if (chunks.length === 0) {
    throw new Error('No chunks generated from document');
  }

  const embeddings = await generateEmbeddings(chunks);

  const docRow = await pool.query<{ course_id: string | null }>(
    'SELECT course_id FROM documents WHERE id = $1',
    [documentId]
  );
  const courseId = docRow.rows[0]?.course_id ?? null;

  const storeStart = Date.now();
  await storeChunks(documentId, userId, chunks, embeddings, pages, courseId);
  console.log(`[Process] Stored chunks in Redis (${Date.now() - storeStart}ms)`);

  await updateDocumentStatus(documentId, 'ready', {
    page_count: pages.length,
    word_count: markdown.split(/\s+/).length,
    processed_at: new Date().toISOString(),
  });

  console.log(`[Process] Done ${documentId}: ${chunks.length} chunks`);
}

export async function processDocumentJobSafe(data: DocumentJobData): Promise<void> {
  try {
    await processDocumentJob(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Process] Failed ${data.documentId}:`, message);
    await updateDocumentStatus(data.documentId, 'failed', {
      error_message: message.slice(0, 500),
    });
  }
}
