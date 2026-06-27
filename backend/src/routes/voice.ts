import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authenticate';
import { transcribeAudio, synthesizeSpeech } from '../services/snwolley';

const router = Router();

// Store upload in memory (audio blobs are small — typically < 2 MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// POST /api/voice/stt
// Body: multipart/form-data  { audio: <blob> }
// Returns: { text: string }
router.post('/stt', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided (field name: audio)' });
  }

  try {
    const text = await transcribeAudio(req.file.buffer, req.file.originalname ?? 'audio.webm');
    res.json({ text });
  } catch (err) {
    console.error('[STT] Error:', err);
    res.status(502).json({ error: 'Speech-to-text service unavailable' });
  }
});

// POST /api/voice/tts
// Body: { text: string }
// Returns: audio/wav binary
router.post('/tts', authenticate, async (req, res) => {
  const { text } = req.body as { text?: string };
  if (!text?.trim()) {
    return res.status(400).json({ error: 'text field is required' });
  }
  if (text.length > 4000) {
    return res.status(400).json({ error: 'text too long (max 4000 chars)' });
  }

  try {
    const wavBuffer = await synthesizeSpeech(text);
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', wavBuffer.length);
    res.send(wavBuffer);
  } catch (err) {
    console.error('[TTS] Error:', err);
    res.status(502).json({ error: 'Text-to-speech service unavailable' });
  }
});

export default router;
