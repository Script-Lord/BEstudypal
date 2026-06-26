import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, AuthedRequest } from '../middleware/authenticate';
import { pool } from '../db/client';
import { documentQueue } from '../queue/jobQueue';
import { deleteFromStorage } from '../services/storage';

const router = Router();

const CreateDocSchema = z.object({
  storagePath: z.string().min(1),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
});

// POST /api/documents — register an uploaded file and enqueue processing
router.post('/', authenticate, async (req, res) => {
  const authed = req as AuthedRequest;

  const parsed = CreateDocSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body', details: parsed.error.issues });
  }

  const { storagePath, fileName, fileType } = parsed.data;
  const documentId = uuidv4();

  await pool.query(
    `INSERT INTO documents (id, user_id, name, file_type, storage_path, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')`,
    [documentId, authed.user.id, fileName, fileType, storagePath]
  );

  await documentQueue.add('process', {
    documentId,
    userId: authed.user.id,
    storagePath,
    fileName,
  });

  res.status(201).json({ id: documentId, status: 'pending' });
});

// GET /api/documents — list user's documents
router.get('/', authenticate, async (req, res) => {
  const authed = req as AuthedRequest;

  const result = await pool.query(
    `SELECT id, name, file_type, status, error_message, page_count, word_count, created_at, processed_at
     FROM documents
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [authed.user.id]
  );

  res.json(result.rows);
});

// GET /api/documents/:id — get single document
router.get('/:id', authenticate, async (req, res) => {
  const authed = req as AuthedRequest;

  const result = await pool.query(
    `SELECT id, name, file_type, status, error_message, page_count, word_count, created_at, processed_at
     FROM documents
     WHERE id = $1 AND user_id = $2`,
    [req.params.id, authed.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Document not found' });
  }

  res.json(result.rows[0]);
});

// DELETE /api/documents/:id
router.delete('/:id', authenticate, async (req, res) => {
  const authed = req as AuthedRequest;

  const result = await pool.query(
    `DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING storage_path`,
    [req.params.id, authed.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Fire-and-forget storage cleanup
  deleteFromStorage(result.rows[0].storage_path).catch(console.error);

  res.json({ success: true });
});

export default router;
