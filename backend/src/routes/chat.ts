import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, AuthedRequest } from '../middleware/authenticate';
import { pool } from '../db/client';
import { generateEmbedding } from '../services/embedding';
import { searchSimilarChunks } from '../services/vectorSearch';
import { getAIProvider } from '../services/aiProvider';

const router = Router();

const QuerySchema = z.object({
  question: z.string().min(1).max(2000),
  sessionId: z.string().uuid().optional(),
});

// POST /api/chat/:documentId/query — RAG query with SSE streaming
router.post('/:documentId/query', authenticate, async (req, res) => {
  const authed = req as AuthedRequest;
  const { documentId } = req.params;

  const parsed = QuerySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body', details: parsed.error.issues });
  }

  const { question } = parsed.data;
  let { sessionId } = parsed.data;

  // Verify document exists and is ready
  const docResult = await pool.query(
    `SELECT id, name, status FROM documents WHERE id = $1 AND user_id = $2`,
    [documentId, authed.user.id]
  );

  if (docResult.rows.length === 0) {
    return res.status(404).json({ error: 'Document not found' });
  }

  if (docResult.rows[0].status !== 'ready') {
    return res.status(400).json({ error: 'Document is not ready yet', status: docResult.rows[0].status });
  }

  // Get or create session
  if (!sessionId) {
    sessionId = uuidv4();
    await pool.query(
      `INSERT INTO chat_sessions (id, user_id, document_id) VALUES ($1, $2, $3)`,
      [sessionId, authed.user.id, documentId]
    );
  }

  // Load conversation history (last 6 messages)
  const historyResult = await pool.query(
    `SELECT role, content FROM messages
     WHERE session_id = $1
     ORDER BY created_at DESC
     LIMIT 6`,
    [sessionId]
  );
  const history = historyResult.rows.reverse();

  // 1. Embed question
  const queryEmbedding = await generateEmbedding(question);

  // 2. Vector search
  const relevantChunks = await searchSimilarChunks(queryEmbedding, documentId, authed.user.id, 5);

  if (relevantChunks.length === 0) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(`data: ${JSON.stringify({ chunk: "I couldn't find relevant content in your document for that question." })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true, sessionId, sources: [] })}\n\n`);
    res.end();
    return;
  }

  // 3. Build context
  const context = relevantChunks
    .map((c, i) => `[Source ${i + 1}]\n${c.content}`)
    .join('\n\n---\n\n');

  const systemPrompt = `You are a document assistant. Answer the user's question based ONLY on the following document excerpts. If the answer is not found in the excerpts, say so clearly. Do not use outside knowledge. Cite source numbers inline when relevant (e.g., "according to [Source 1]...").

DOCUMENT EXCERPTS:
${context}`;

  // 4. Build messages
  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
    { role: 'user' as const, content: question },
  ];

  // 5. Stream response
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const ai = getAIProvider();
  let fullResponse = '';

  try {
    await ai.chatStream(messages, (chunk) => {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    });
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: 'AI provider error' })}\n\n`);
    res.end();
    return;
  }

  // 6. Persist messages
  await pool.query(
    `INSERT INTO messages (session_id, role, content, source_chunks)
     VALUES ($1, 'user', $2, '[]')`,
    [sessionId, question]
  );
  await pool.query(
    `INSERT INTO messages (session_id, role, content, source_chunks)
     VALUES ($1, 'assistant', $2, $3)`,
    [sessionId, fullResponse, JSON.stringify(relevantChunks.map(c => c.id))]
  );

  res.write(`data: ${JSON.stringify({ done: true, sessionId, sources: relevantChunks })}\n\n`);
  res.end();
});

// GET /api/chat/:documentId/sessions — list sessions for a document
router.get('/:documentId/sessions', authenticate, async (req, res) => {
  const authed = req as AuthedRequest;

  const result = await pool.query(
    `SELECT id, created_at FROM chat_sessions
     WHERE document_id = $1 AND user_id = $2
     ORDER BY created_at DESC`,
    [req.params.documentId, authed.user.id]
  );

  res.json(result.rows);
});

// GET /api/chat/:documentId/sessions/:sessionId/messages
router.get('/:documentId/sessions/:sessionId/messages', authenticate, async (req, res) => {
  const authed = req as AuthedRequest;

  const sessionCheck = await pool.query(
    `SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2 AND document_id = $3`,
    [req.params.sessionId, authed.user.id, req.params.documentId]
  );

  if (sessionCheck.rows.length === 0) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const result = await pool.query(
    `SELECT id, role, content, source_chunks, created_at
     FROM messages
     WHERE session_id = $1
     ORDER BY created_at ASC`,
    [req.params.sessionId]
  );

  res.json(result.rows);
});

export default router;
