import IORedis from 'ioredis';
import { Queue } from 'bullmq';

export const redisConnection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export interface DocumentJobData {
  documentId: string;
  userId: string;
  storagePath: string;
  fileName: string;
}

export const documentQueue = new Queue<DocumentJobData>('document-processing', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});
