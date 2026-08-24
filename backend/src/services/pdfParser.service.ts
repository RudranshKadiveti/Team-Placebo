import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export const extractTextFromPdf = async (pdfBuffer: Buffer): Promise<string> => {
  try {
    const fn = require('pdf-parse');
    const data = await fn(pdfBuffer);
    if (data?.text) {
      return data.text.replace(/\0/g, '').trim();
    }
  } catch (error: any) {
    console.error('PDF text extraction parser error:', error.message);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
  throw new Error('PDF parsing failed to return text.');
};
