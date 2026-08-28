import fs from 'fs';
import path from 'path';
import { prisma } from '../config/database.js';
import { EMBEDDING_CONFIG } from '../config/embedding.config.js';
import { chunkResumeText } from './chunker.service.js';
import { generateEmbedding } from './embedding.service.js';
import { extractTextFromPdf } from './pdfParser.service.js';
import { CustomError } from './resume.service.js';

export interface ResumeEmbeddingSummary {
  resumeId: string;
  totalChunks: number;
  reusedChunks: number;
  generatedChunks: number;
  deletedChunks: number;
  embeddingModel: string;
  embeddingDimension: number;
  normalized: boolean;
  chunkingVersion: string;
}

export const generateResumeEmbeddings = async (
  resumeId: string,
  userId: string
): Promise<ResumeEmbeddingSummary> => {
  // 1. Retrieve resume record
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
  });

  if (!resume) {
    const error: CustomError = new Error('Resume not found');
    error.statusCode = 404;
    throw error;
  }

  // Security Ownership Check
  if (resume.userId !== userId) {
    const error: CustomError = new Error('Access denied: You do not own this resume');
    error.statusCode = 403;
    throw error;
  }

  // 2. Retrieve / Extract Raw Text
  let rawText = resume.rawText || '';

  if (!rawText.trim()) {
    const fullPath = path.resolve(process.cwd(), 'uploads', resume.storageKey);
    if (fs.existsSync(fullPath)) {
      const buffer = await fs.promises.readFile(fullPath);
      if (resume.fileType.includes('pdf') || resume.originalFileName.endsWith('.pdf')) {
        rawText = await extractTextFromPdf(buffer);
      } else {
        rawText = buffer.toString('utf-8');
      }

      if (rawText.trim()) {
        await prisma.resume.update({
          where: { id: resumeId },
          data: { rawText },
        });
      }
    }
  }

  if (!rawText.trim()) {
    const error: CustomError = new Error('Unable to extract text content from resume file for embedding');
    error.statusCode = 400;
    throw error;
  }

  // 3. Generate Semantic Chunks
  const newChunks = chunkResumeText(rawText);

  // 4. Retrieve Existing DB Chunks
  const existingDbChunks = await prisma.resumeChunk.findMany({
    where: { resumeId },
    orderBy: { chunkIndex: 'asc' },
  });

  let reusedChunks = 0;
  let generatedChunks = 0;

  // Process chunks
  for (const chunk of newChunks) {
    const existing = existingDbChunks.find(
      (c) =>
        c.chunkIndex === chunk.chunkIndex &&
        c.contentHash === chunk.contentHash &&
        c.embeddingModel === EMBEDDING_CONFIG.MODEL_NAME &&
        c.embeddingDimension === EMBEDDING_CONFIG.DIMENSION &&
        c.embeddingVersion === EMBEDDING_CONFIG.MODEL_VERSION &&
        c.chunkingVersion === EMBEDDING_CONFIG.CHUNKING_VERSION &&
        c.normalized === EMBEDDING_CONFIG.NORMALIZED
    );

    if (existing) {
      reusedChunks++;
    } else {
      // Generate new normalized embedding vector
      const vector = await generateEmbedding(chunk.content);
      const vectorSqlString = `[${vector.join(',')}]`;

      // Upsert ResumeChunk metadata
      const createdChunk = await prisma.resumeChunk.upsert({
        where: {
          id: existingDbChunks.find((c) => c.chunkIndex === chunk.chunkIndex)?.id || 'nonexistent-uuid-placeholder',
        },
        create: {
          resumeId,
          chunkIndex: chunk.chunkIndex,
          sectionType: chunk.sectionType,
          content: chunk.content,
          contentHash: chunk.contentHash,
          embeddingModel: EMBEDDING_CONFIG.MODEL_NAME,
          embeddingVersion: EMBEDDING_CONFIG.MODEL_VERSION,
          embeddingDimension: EMBEDDING_CONFIG.DIMENSION,
          normalized: EMBEDDING_CONFIG.NORMALIZED,
          chunkingVersion: EMBEDDING_CONFIG.CHUNKING_VERSION,
        },
        update: {
          sectionType: chunk.sectionType,
          content: chunk.content,
          contentHash: chunk.contentHash,
          embeddingModel: EMBEDDING_CONFIG.MODEL_NAME,
          embeddingVersion: EMBEDDING_CONFIG.MODEL_VERSION,
          embeddingDimension: EMBEDDING_CONFIG.DIMENSION,
          normalized: EMBEDDING_CONFIG.NORMALIZED,
          chunkingVersion: EMBEDDING_CONFIG.CHUNKING_VERSION,
        },
      });

      // Update pgvector column using Raw Query
      await prisma.$executeRawUnsafe(
        `UPDATE resume_chunks SET embedding = $1::vector WHERE id = $2`,
        vectorSqlString,
        createdChunk.id
      );

      generatedChunks++;
    }
  }

  // Delete Obsolete Chunks
  const obsoleteChunkIds = existingDbChunks
    .filter((c) => c.chunkIndex >= newChunks.length)
    .map((c) => c.id);

  if (obsoleteChunkIds.length > 0) {
    await prisma.resumeChunk.deleteMany({
      where: {
        id: { in: obsoleteChunkIds },
      },
    });
  }

  return {
    resumeId,
    totalChunks: newChunks.length,
    reusedChunks,
    generatedChunks,
    deletedChunks: obsoleteChunkIds.length,
    embeddingModel: EMBEDDING_CONFIG.MODEL_NAME,
    embeddingDimension: EMBEDDING_CONFIG.DIMENSION,
    normalized: EMBEDDING_CONFIG.NORMALIZED,
    chunkingVersion: EMBEDDING_CONFIG.CHUNKING_VERSION,
  };
};
