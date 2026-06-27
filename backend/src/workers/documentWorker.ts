import { Worker } from 'bullmq';
import { redisConnection, DocumentJobData } from '../queue/jobQueue';
import { processDocumentJobSafe } from '../services/processDocument';

const worker = new Worker<DocumentJobData>(
  'document-processing',
  async (job) => {
    await processDocumentJobSafe(job.data);
  },
  {
    connection: redisConnection,
    concurrency: 3,
  }
);

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job failed ${job?.id}:`, err.message);
});

worker.on('completed', (job) => {
  console.log(`[Worker] Job completed ${job.id}`);
});

console.log('[Worker] Document processing worker started');

export default worker;
