import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, AuthedRequest } from '../middleware/authenticate';
import { pool } from '../db/client';
import { searchChunksInCourse } from '../services/vectorSearch';
import { getAIProvider } from '../services/aiProvider';

const router = Router();

const CourseSchema = z.object({
  title:       z.string().min(1).max(200),
  code:        z.string().min(1).max(30),
  level:       z.string().min(1).max(50),
  description: z.string().max(1000).optional(),
  is_public:   z.boolean().default(false),
});

// POST /api/courses
router.post('/', authenticate, async (req, res) => {
  const authed = req as AuthedRequest;
  const parsed = CourseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body', details: parsed.error.issues });

  const { title, code, level, description, is_public } = parsed.data;
  const id = uuidv4();

  await pool.query(
    `INSERT INTO courses (id, user_id, title, code, level, description, is_public)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [id, authed.user.id, title, code, level, description ?? null, is_public]
  );

  const row = await pool.query(
    `SELECT c.*, 0 AS doc_count FROM courses c WHERE c.id = $1`,
    [id]
  );
  res.status(201).json(row.rows[0]);
});

// GET /api/courses
router.get('/', authenticate, async (req, res) => {
  const authed = req as AuthedRequest;
  const result = await pool.query(
    `SELECT c.*,
       COUNT(d.id) FILTER (WHERE d.status = 'ready') AS doc_count
     FROM courses c
     LEFT JOIN documents d ON d.course_id = c.id
     WHERE c.user_id = $1
     GROUP BY c.id
     ORDER BY c.created_at DESC`,
    [authed.user.id]
  );
  res.json(result.rows);
});

// GET /api/courses/:id
router.get('/:id', authenticate, async (req, res) => {
  const authed = req as AuthedRequest;
  const result = await pool.query(
    `SELECT c.*, COUNT(d.id) FILTER (WHERE d.status = 'ready') AS doc_count
     FROM courses c
     LEFT JOIN documents d ON d.course_id = c.id
     WHERE c.id = $1 AND c.user_id = $2
     GROUP BY c.id`,
    [req.params.id, authed.user.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Course not found' });
  res.json(result.rows[0]);
});

// GET /api/courses/:id/documents
router.get('/:id/documents', authenticate, async (req, res) => {
  const authed = req as AuthedRequest;
  const courseCheck = await pool.query(
    `SELECT id FROM courses WHERE id = $1 AND user_id = $2`,
    [req.params.id, authed.user.id]
  );
  if (courseCheck.rows.length === 0) return res.status(404).json({ error: 'Course not found' });

  const docs = await pool.query(
    `SELECT id, name, file_type, status, error_message, page_count, word_count, created_at, processed_at
     FROM documents
     WHERE course_id = $1 AND user_id = $2
     ORDER BY created_at DESC`,
    [req.params.id, authed.user.id]
  );
  res.json(docs.rows);
});

// PUT /api/courses/:id
router.put('/:id', authenticate, async (req, res) => {
  const authed = req as AuthedRequest;
  const parsed = CourseSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body', details: parsed.error.issues });

  const fields = parsed.data;
  const sets: string[] = [];
  const vals: unknown[] = [];
  let i = 1;

  const map: Record<string, unknown> = {
    title: fields.title, code: fields.code, level: fields.level,
    description: fields.description, is_public: fields.is_public,
  };
  for (const [col, val] of Object.entries(map)) {
    if (val !== undefined) { sets.push(`${col} = $${i++}`); vals.push(val); }
  }
  if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });

  vals.push(req.params.id, authed.user.id);
  const result = await pool.query(
    `UPDATE courses SET ${sets.join(', ')} WHERE id = $${i++} AND user_id = $${i} RETURNING *`,
    vals
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Course not found' });
  res.json(result.rows[0]);
});

// DELETE /api/courses/:id
router.delete('/:id', authenticate, async (req, res) => {
  const authed = req as AuthedRequest;
  const result = await pool.query(
    `DELETE FROM courses WHERE id = $1 AND user_id = $2 RETURNING id`,
    [req.params.id, authed.user.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Course not found' });
  res.json({ success: true });
});

// POST /api/courses/:id/chat — RAG over all docs in course (owner)
router.post('/:id/chat', authenticate, async (req, res) => {
  const authed = req as AuthedRequest;
  const { question, webSearch } = req.body as { question?: string; webSearch?: boolean };
  if (!question?.trim()) return res.status(400).json({ error: 'question is required' });

  const courseResult = await pool.query(
    `SELECT id, title, code FROM courses WHERE id = $1 AND user_id = $2`,
    [req.params.id, authed.user.id]
  );
  if (courseResult.rows.length === 0) return res.status(404).json({ error: 'Course not found' });
  const course = courseResult.rows[0];

  const chunks = await searchChunksInCourse(req.params.id, 8, question);
  const context = chunks.length > 0
    ? chunks.map((c, idx) => `[Source ${idx + 1}]\n${c.content}`).join('\n\n---\n\n')
    : '(No relevant content found in course documents.)';

  const systemPrompt = webSearch
    ? `You are a study assistant for "${course.title} (${course.code})". Use the course material excerpts below as your primary source and cite them inline, e.g. [Source 1]. When the excerpts are incomplete, you MAY add relevant, accurate background knowledge to give a fuller answer. Clearly separate that supplementary information under a short heading like "Beyond your sources:" so the student knows it is not from their material. Stay focused on what the student asked.\n\nCOURSE MATERIAL:\n${context}`
    : `You are a study assistant for "${course.title} (${course.code})". Answer ONLY from the course material excerpts below. Cite source numbers inline, e.g. [Source 1]. If the answer is not in the excerpts, say so clearly.\n\nCOURSE MATERIAL:\n${context}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const ai = getAIProvider();
  try {
    await ai.chatStream(
      [{ role: 'system', content: systemPrompt }, { role: 'user', content: question }],
      chunk => res.write(`data: ${JSON.stringify({ chunk })}\n\n`)
    );
  } catch {
    res.write(`data: ${JSON.stringify({ error: 'AI error' })}\n\n`);
    res.end();
    return;
  }

  res.write(`data: ${JSON.stringify({ done: true, sources: chunks })}\n\n`);
  res.end();
});

export default router;
