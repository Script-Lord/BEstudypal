import { documentQueue, DocumentJobData } from '../queue/jobQueue';
import { processDocumentJobSafe } from './processDocument';

export function isNetlifyRuntime(): boolean {
  return process.env.NETLIFY === 'true' || !!process.env.NETLIFY_DEV;
}

export async function enqueueDocumentProcessing(data: DocumentJobData): Promise<void> {
  if (isNetlifyRuntime()) {
    const base = process.env.URL ?? process.env.DEPLOY_PRIME_URL ?? 'http://localhost:8888';
    const secret = process.env.INTERNAL_JOB_SECRET ?? 'dev-local-secret';

    try {
      const res = await fetch(`${base}/.netlify/functions/process-document-background`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-token': secret,
        },
        body: JSON.stringify(data),
      });

      if (res.ok || res.status === 202) return;
      const text = await res.text().catch(() => '');
      throw new Error(`Background processor rejected (${res.status}): ${text}`);
    } catch (err) {
      console.warn('[Enqueue] Background invoke failed, processing inline:', err);
      await processDocumentJobSafe(data);
    }
    return;
  }

  await documentQueue.add('process', data);
}

/** Process immediately in-process (fallback when background invoke fails locally). */
export async function processDocumentInline(data: DocumentJobData): Promise<void> {
  await processDocumentJobSafe(data);
}
