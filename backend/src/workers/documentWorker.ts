import { Worker } from 'bullmq';
import { redisConnection, DocumentJobData } from '../queue/jobQueue';
import { pool } from '../db/client';
import { downloadFromStorage } from '../services/storage';
import { parseDocument } from '../services/docProcessor';
import { chunkText, generateEmbeddings } from '../services/embedding';
import { storeChunks } from '../services/vectorSearch';

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

const worker = new Worker<DocumentJobData>(
  'document-processing',
  async (job) => {
    const { documentId, userId, storagePath, fileName } = job.data;

    console.log(`[Worker] Processing doc ${documentId}`);
    await updateDocumentStatus(documentId, 'processing');

    // 1. Download from Supabase Storage
    await job.updateProgress(10);
    const fileBuffer = await downloadFromStorage(storagePath);

    // 2. Parse (pdf-parse / mammoth locally, Docling as fallback)
    await job.updateProgress(20);
    const parseStart = Date.now();
    const { markdown, pages } = await parseDocument(fileBuffer, fileName);
    console.log(`[Worker] Parsed ${fileName} in ${Date.now() - parseStart}ms`);

    if (!markdown || markdown.trim().length === 0) {
      throw new Error('Document parser returned empty content');
    }

    // 3. Chunk
    await job.updateProgress(50);
    const chunks = chunkText(markdown);
    console.log(`[Worker] ${chunks.length} chunks from ${markdown.length} chars`);

    if (chunks.length === 0) {
      throw new Error('No chunks generated from document');
    }

    // 4. Embed
    await job.updateProgress(60);
    const embeddings = await generateEmbeddings(chunks);

    // 5. Store
    await job.updateProgress(80);
    const storeStart = Date.now();
    await storeChunks(documentId, userId, chunks, embeddings, pages);
    console.log(`[Worker] Stored chunks in ${Date.now() - storeStart}ms`);

    // 6. Mark ready
    await updateDocumentStatus(documentId, 'ready', {
      page_count: pages.length,
      word_count: markdown.split(/\s+/).length,
      processed_at: new Date().toISOString(),
    });

    await job.updateProgress(100);
    console.log(`[Worker] Done ${documentId}: ${chunks.length} chunks`);
  },
  {
    connection: redisConnection,
    concurrency: 3,
  }
);

worker.on('failed', async (job, err) => {
  console.error(`[Worker] Job failed ${job?.id}:`, err.message);
  if (job) {
    await updateDocumentStatus(job.data.documentId, 'failed', {
      error_message: err.message.slice(0, 500),
    });
  }
});

worker.on('completed', (job) => {
  console.log(`[Worker] Job completed ${job.id}`);
});

console.log('[Worker] Document processing worker started');

export default worker;
