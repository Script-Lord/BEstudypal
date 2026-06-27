import { Queue } from 'bullmq';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

/** BullMQ connection options (avoids ioredis version mismatch with bullmq's bundled copy). */
export function getRedisConnectionOptions() {
  return {
    url: redisUrl,
    maxRetriesPerRequest: null as null,
    ...(redisUrl.startsWith('rediss://') ? { tls: {} } : {}),
  };
}

export const redisConnection = getRedisConnectionOptions();

export interface DocumentJobData {
  documentId: string;
  userId: string;
  storagePath: string;
  fileName: string;
}

export const documentQueue = new Queue<DocumentJobData>('document-processing', {
  connection: getRedisConnectionOptions(),
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
