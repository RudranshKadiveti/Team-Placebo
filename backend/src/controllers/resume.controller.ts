import type { Request, Response, NextFunction } from 'express';
import { getUserResumes, getResumeById, createResumeRecord } from '../services/resume.service.js';
import { generateResumeEmbeddings } from '../services/resumeEmbedding.service.js';
import { storageService } from '../services/storage.service.js';
import { resumeIdParamSchema } from '../validators/resume.validator.js';
import { CustomError } from '../middleware/errorHandler.js';
import { prisma } from '../config/database.js';

export const getResumes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const resumes = await getUserResumes(userId);
    return res.status(200).json({
      success: true,
      data: resumes,
    });
  } catch (error) {
    return next(error);
  }
};

export const getResumeByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = resumeIdParamSchema.safeParse(req.params);

    if (!validationResult.success) {
      const error: CustomError = new Error(validationResult.error.errors[0].message);
      error.statusCode = 400;
      return next(error);
    }

    const userId = req.user!.id;
    const resume = await getResumeById(validationResult.data.id, userId);

    return res.status(200).json({
      success: true,
      data: resume,
    });
  } catch (error) {
    return next(error);
  }
};

export const uploadResumeController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      const error: CustomError = new Error('No resume file provided');
      error.statusCode = 400;
      return next(error);
    }

    const userId = req.user!.id;
    
    // Check for duplicate resume by filename for the same user
    const existing = await prisma.resume.findFirst({
      where: {
        userId,
        originalFileName: req.file.originalname,
      },
    });

    const storageResult = await storageService.saveFile(req.file, 'resumes');

    let resumeRecord;
    if (existing) {
      // Overwrite/Update existing duplicate record with fresh file details
      resumeRecord = await prisma.resume.update({
        where: { id: existing.id },
        data: {
          fileSize: req.file.size,
          fileType: req.file.mimetype || 'application/octet-stream',
          storageKey: storageResult.storageKey,
          rawText: null,
          structuredContent: null,
          atsScore: null,
          uploadedAt: new Date(),
        },
      });
    } else {
      resumeRecord = await createResumeRecord({
        userId,
        originalFileName: req.file.originalname,
        fileType: req.file.mimetype || 'application/octet-stream',
        fileSize: req.file.size,
        storageKey: storageResult.storageKey,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Resume file uploaded successfully',
      data: resumeRecord,
    });
  } catch (error) {
    return next(error);
  }
};

export const embedResumeController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = resumeIdParamSchema.safeParse(req.params);

    if (!validationResult.success) {
      const error: CustomError = new Error(validationResult.error.errors[0].message);
      error.statusCode = 400;
      return next(error);
    }

    const userId = req.user!.id;
    const summary = await generateResumeEmbeddings(validationResult.data.id, userId);

    return res.status(200).json({
      success: true,
      message: 'Resume embeddings generated successfully',
      data: summary,
    });
  } catch (error) {
    return next(error);
  }
};

export const parseResumeController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = resumeIdParamSchema.safeParse(req.params);

    if (!validationResult.success) {
      const error: CustomError = new Error(validationResult.error.errors[0].message);
      error.statusCode = 400;
      return next(error);
    }

    const userId = req.user!.id;
    const { parseResumeRecord } = await import('../services/resumeParser.service.js');
    const parsedData = await parseResumeRecord(validationResult.data.id, userId);

    return res.status(200).json({
      success: true,
      message: 'Resume parsed successfully',
      data: parsedData,
    });
  } catch (error) {
    return next(error);
  }
};

export const scoreResumeController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = resumeIdParamSchema.safeParse(req.params);

    if (!validationResult.success) {
      const error: CustomError = new Error(validationResult.error.errors[0].message);
      error.statusCode = 400;
      return next(error);
    }

    const userId = req.user!.id;
    const { calculateAtsScore } = await import('../services/atsScoring.service.js');
    const scoreData = await calculateAtsScore(validationResult.data.id, userId);

    return res.status(200).json({
      success: true,
      message: 'Resume ATS score calculated successfully',
      data: scoreData,
    });
  } catch (error) {
    return next(error);
  }
};
