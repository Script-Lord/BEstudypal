import axios from 'axios';
import FormData from 'form-data';
import { describeImageBuffer } from './snwolley';

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const TEXT_EXTS = new Set(['.txt', '.md', '.markdown']);

function isImageFile(fileName: string): boolean {
  const ext = '.' + (fileName.split('.').pop()?.toLowerCase() ?? '');
  return IMAGE_EXTS.has(ext);
}

function isTextFile(fileName: string): boolean {
  const ext = '.' + (fileName.split('.').pop()?.toLowerCase() ?? '');
  return TEXT_EXTS.has(ext);
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

  // Route image files through Snwolley Vision for richer description
  if (isImageFile(fileName)) {
    return parseImageWithVision(fileBuffer, fileName);
  }

  // All other formats go to Docling
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

async function parseWithDocling(
  fileBuffer: Buffer,
  fileName: string
): Promise<DoclingResult> {
  const form = new FormData();
  form.append('file', fileBuffer, { filename: fileName });

  const { data } = await axios.post<DoclingResult>(
    `${process.env.DOCLING_SERVICE_URL}/parse`,
    form,
    {
      headers: form.getHeaders(),
      timeout: 300_000,
      maxBodyLength: 100 * 1024 * 1024,
    }
  );

  return data;
}
