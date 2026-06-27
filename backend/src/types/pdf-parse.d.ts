declare module 'pdf-parse' {
  interface PDFInfo {
    Title?: string;
    Author?: string;
  }

  interface PDFData {
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata: unknown;
    text: string;
    version: string;
  }

  function pdf(data: Buffer, options?: Record<string, unknown>): Promise<PDFData>;
  export default pdf;
}
