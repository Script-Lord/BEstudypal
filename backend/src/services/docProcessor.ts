import axios from 'axios';
import FormData from 'form-data';

export interface DoclingResult {
  markdown: string;
  pages: Array<{ page_number: number; text: string }>;
  metadata: { page_count: number };
}

export async function parseDocument(
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
