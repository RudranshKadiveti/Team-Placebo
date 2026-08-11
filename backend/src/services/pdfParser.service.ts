import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export const extractTextFromPdf = async (pdfBuffer: Buffer): Promise<string> => {
  try {
    const pdfModule = require('pdf-parse');
    let fn = pdfModule;
    if (typeof fn !== 'function' && fn.default) {
      fn = fn.default;
    }

    if (typeof fn === 'function') {
      const data = await fn(pdfBuffer);
      if (data?.text) {
        return data.text.replace(/\0/g, '').trim();
      }
    }
  } catch (error) {
    console.error('PDF text extraction parser error:', error);
  }

  // Robust null-byte sanitized text extractor fallback for PDF binary buffers
  const rawText = pdfBuffer.toString('utf-8').replace(/\0/g, '');
  const printableText = rawText.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
  return printableText.trim();
};
