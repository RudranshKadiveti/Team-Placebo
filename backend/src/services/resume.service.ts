import { prisma } from '../config/database.js';

export interface CustomError extends Error {
  statusCode?: number;
}

export interface ResumeMetadata {
  id: string;
  userId: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  storageKey: string;
  atsScore?: any;
  uploadedAt: Date;
  updatedAt: Date;
}

const parseAtsScoreField = (atsScore: any) => {
  if (typeof atsScore === 'string') {
    try {
      return JSON.parse(atsScore);
    } catch {
      return null;
    }
  }
  return atsScore;
};

/**
 * Retrieve all unique resume metadata records for the authenticated user (deduplicated by originalFileName).
 */
export const getUserResumes = async (userId: string): Promise<ResumeMetadata[]> => {
  const resumes = await prisma.resume.findMany({
    where: { userId },
    orderBy: { uploadedAt: 'desc' },
  });

  // Deduplicate by originalFileName (keep latest uploaded version)
  const uniqueMap = new Map<string, typeof resumes[0]>();
  for (const r of resumes) {
    if (!uniqueMap.has(r.originalFileName)) {
      uniqueMap.set(r.originalFileName, r);
    }
  }

  const deduplicated = Array.from(uniqueMap.values());

  return deduplicated.map(r => ({
    ...r,
    atsScore: parseAtsScoreField(r.atsScore)
  }));
};

/**
 * Retrieve specific resume metadata by ID, ensuring strict user ownership isolation.
 */
export const getResumeById = async (id: string, userId: string): Promise<ResumeMetadata> => {
  const resume = await prisma.resume.findUnique({
    where: { id },
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

  return {
    ...resume,
    atsScore: parseAtsScoreField(resume.atsScore)
  };
};

/**
 * Persist new resume metadata record in database.
 */
export const createResumeRecord = async (data: {
  userId: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  storageKey: string;
}): Promise<ResumeMetadata> => {
  return prisma.resume.create({
    data,
  });
};
