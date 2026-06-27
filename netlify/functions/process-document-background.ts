import 'dotenv/config';
import type { Config } from '@netlify/functions';
import { processDocumentJobSafe, DocumentJobData } from '../../backend/src/services/processDocument';

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const token = req.headers.get('x-internal-token');
  const secret = process.env.INTERNAL_JOB_SECRET ?? 'dev-local-secret';
  if (token !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const data = (await req.json()) as DocumentJobData;
  await processDocumentJobSafe(data);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const config: Config = {
  path: '/.netlify/functions/process-document-background',
};
