import { Router } from 'express';
import { pool } from '../db/client';
import { searchChunksInCourse } from '../services/vectorSearch';
import { getAIProvider } from '../services/aiProvider';

const router = Router();

// GET /api/public/courses — browse all public courses (no auth)
router.get('/courses', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.title, c.code, c.level, c.description, c.created_at,
         COUNT(d.id) FILTER (WHERE d.status = 'ready') AS doc_count,
         split_part(u.email, '@', 1) AS author
       FROM courses c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN documents d ON d.course_id = c.id
       WHERE c.is_public = true
       GROUP BY c.id, u.email
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/public/courses:', err);
    res.status(503).json({ error: 'Database unavailable' });
  }
});

// GET /api/public/courses/:id — single public course + its ready documents
router.get('/courses/:id', async (req, res) => {
  try {
    const courseResult = await pool.query(
      `SELECT c.*, split_part(u.email, '@', 1) AS author
       FROM courses c
       JOIN users u ON u.id = c.user_id
       WHERE c.id = $1 AND c.is_public = true`,
      [req.params.id]
    );
    if (courseResult.rows.length === 0) return res.status(404).json({ error: 'Course not found' });

    const docs = await pool.query(
      `SELECT id, name, file_type, status, page_count, word_count, created_at
       FROM documents
       WHERE course_id = $1 AND status = 'ready'
       ORDER BY created_at DESC`,
      [req.params.id]
    );

    res.json({ ...courseResult.rows[0], documents: docs.rows });
  } catch (err) {
    console.error('GET /api/public/courses/:id:', err);
    res.status(503).json({ error: 'Database unavailable' });
  }
});

// POST /api/public/courses/:id/chat — stateless RAG for public visitors (no auth, history not saved)
router.post('/courses/:id/chat', async (req, res) => {
  const { question, webSearch } = req.body as { question?: string; webSearch?: boolean };
  if (!question?.trim()) return res.status(400).json({ error: 'question is required' });

  let course;
  try {
    const courseResult = await pool.query(
      `SELECT id, title, code FROM courses WHERE id = $1 AND is_public = true`,
      [req.params.id]
    );
    if (courseResult.rows.length === 0) return res.status(404).json({ error: 'Course not found' });
    course = courseResult.rows[0];
  } catch (err) {
    console.error('POST /api/public/courses/:id/chat:', err);
    return res.status(503).json({ error: 'Database unavailable' });
  }

  const chunks = await searchChunksInCourse(req.params.id, 8, question);
  const context = chunks.length > 0
    ? chunks.map((c, idx) => `[Source ${idx + 1}]\n${c.content}`).join('\n\n---\n\n')
    : '(No relevant content found in course documents.)';

  const systemPrompt = webSearch
    ? `You are a public study assistant for "${course.title} (${course.code})". Use the course material excerpts below as your primary source and cite them inline, e.g. [Source 1]. When the excerpts are incomplete, you MAY add relevant, accurate background knowledge to give a fuller answer. Clearly separate that supplementary information under a short heading like "Beyond your sources:" so the reader knows it is not from the course material. Stay focused on what was asked.\n\nCOURSE MATERIAL:\n${context}`
    : `You are a public study assistant for "${course.title} (${course.code})". Answer ONLY from the course material excerpts below. Cite source numbers inline, e.g. [Source 1]. If the answer is not in the excerpts, say so.\n\nCOURSE MATERIAL:\n${context}`;

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
