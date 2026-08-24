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

/**
 * Retrieve all resume metadata records for the authenticated user.
 */
export const getUserResumes = async (userId: string): Promise<ResumeMetadata[]> => {
  return prisma.resume.findMany({
    where: { userId },
    orderBy: { uploadedAt: 'desc' },
  });
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

  return resume;
};

/**
 * Persist new resume metadata record in PostgreSQL.
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
