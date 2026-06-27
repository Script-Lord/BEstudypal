import axios from 'axios';
import FormData from 'form-data';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';
import { describeImageBuffer } from './snwolley';

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const TEXT_EXTS = new Set(['.txt', '.md', '.markdown']);
const LEGACY_OFFICE_EXTS = new Set(['.doc', '.ppt', '.pptx']);

function getExt(fileName: string): string {
  return '.' + (fileName.split('.').pop()?.toLowerCase() ?? '');
}

function isImageFile(fileName: string): boolean {
  return IMAGE_EXTS.has(getExt(fileName));
}

function isTextFile(fileName: string): boolean {
  return TEXT_EXTS.has(getExt(fileName));
}

export interface DoclingResult {
  markdown: string;
  pages: Array<{ page_number: number; text: string }>;
  metadata: { page_count: number };
}

export async function parseDocument(
  fileBuffer: Buffer,
  fileName: string
): Promise<DoclingResult> {
  if (isTextFile(fileName)) {
    const markdown = fileBuffer.toString('utf8').trim();
    return {
      markdown,
      pages: [{ page_number: 1, text: markdown }],
      metadata: { page_count: 1 },
    };
  }

  if (isImageFile(fileName)) {
    return parseImageWithVision(fileBuffer, fileName);
  }

  const ext = getExt(fileName);

  if (!LEGACY_OFFICE_EXTS.has(ext)) {
    try {
      const result = await parseWithLocalLibs(fileBuffer, fileName);
      if (result.markdown.trim().length > 0) {
        console.log(`[docProcessor] Parsed ${fileName} locally (${ext})`);
        return result;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[docProcessor] Local parse failed for ${fileName}: ${message}`);
    }
  }

  return parseWithDocling(fileBuffer, fileName);
}

async function parseImageWithVision(
  fileBuffer: Buffer,
  fileName: string
): Promise<DoclingResult> {
  const description = await describeImageBuffer(fileBuffer, fileName);

  const markdown = description
    ? `# Image Analysis: ${fileName}\n\n${description}`
    : `# ${fileName}\n\n(No description returned from Vision API)`;

  return {
    markdown,
    pages: [{ page_number: 1, text: description }],
    metadata: { page_count: 1 },
  };
}

async function parseWithLocalLibs(
  fileBuffer: Buffer,
  fileName: string
): Promise<DoclingResult> {
  const ext = getExt(fileName);

  if (ext === '.pdf') {
    return parsePdf(fileBuffer);
  }

  if (ext === '.docx') {
    return parseDocx(fileBuffer);
  }

  throw new Error(`No local parser for ${ext}`);
}

async function parsePdf(fileBuffer: Buffer): Promise<DoclingResult> {
  const data = await pdf(fileBuffer);
  const text = data.text.trim();

  if (!text) {
    throw new Error('pdf-parse returned empty content');
  }

  return {
    markdown: text,
    pages: [{ page_number: 1, text }],
    metadata: { page_count: data.numpages || 1 },
  };
}

async function parseDocx(fileBuffer: Buffer): Promise<DoclingResult> {
  const { value } = await mammoth.extractRawText({ buffer: fileBuffer });
  const text = value.trim();

  if (!text) {
    throw new Error('mammoth returned empty content');
  }

  return {
    markdown: text,
    pages: [{ page_number: 1, text }],
    metadata: { page_count: 1 },
  };
}

async function parseWithDocling(
  fileBuffer: Buffer,
  fileName: string
): Promise<DoclingResult> {
  const doclingUrl = process.env.DOCLING_SERVICE_URL;
  if (!doclingUrl) {
    throw new Error(
      'Document parsing failed locally and DOCLING_SERVICE_URL is not configured'
    );
  }

  console.log(`[docProcessor] Falling back to Docling for ${fileName}`);

  const form = new FormData();
  form.append('file', fileBuffer, { filename: fileName });

  try {
    const { data } = await axios.post<DoclingResult>(
      `${doclingUrl}/parse`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 300_000,
        maxBodyLength: 100 * 1024 * 1024,
      }
    );

    return data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const detail = err.response?.data?.detail ?? err.message;
      throw new Error(`Docling fallback failed: ${detail}`);
    }
    throw err;
  }
}
