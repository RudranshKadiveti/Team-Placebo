import type { Request, Response, NextFunction } from 'express';
import { getUserResumes, getResumeById, createResumeRecord, deleteResumeRecord } from '../services/resume.service.js';
import { generateResumeEmbeddings } from '../services/resumeEmbedding.service.js';
import { storageService } from '../services/storage.service.js';
import { resumeIdParamSchema } from '../validators/resume.validator.js';
import { tailorBulletSchema, analyzeRoleSchema, actionPlanSchema } from '../validators/tailoring.validator.js';
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

export const deleteResumeController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = resumeIdParamSchema.safeParse(req.params);

    if (!validationResult.success) {
      const error: CustomError = new Error(validationResult.error.errors[0].message);
      error.statusCode = 400;
      return next(error);
    }

    const userId = req.user!.id;
    const result = await deleteResumeRecord(validationResult.data.id, userId);

    return res.status(200).json({
      success: true,
      message: result.message,
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

/**
 * Phase 4E: Feature 1 - AI-Assisted Resume Bullet Point Rewriting Controller
 */
export const tailorBulletController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = tailorBulletSchema.safeParse(req.body);

    if (!validationResult.success) {
      const error: CustomError = new Error(validationResult.error.errors[0].message);
      error.statusCode = 400;
      return next(error);
    }

    const { tailorBulletPoint } = await import('../services/resumeAI/bulletTailoring.service.js');
    const result = await tailorBulletPoint(validationResult.data);

    return res.status(200).json({
      success: true,
      message: 'Resume bullet point tailored successfully',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Phase 4E: Feature 2 - Target Role Skill Gap Identification Controller
 */
export const analyzeRoleController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = analyzeRoleSchema.safeParse(req.body);

    if (!validationResult.success) {
      const error: CustomError = new Error(validationResult.error.errors[0].message);
      error.statusCode = 400;
      return next(error);
    }

    const userId = req.user!.id;
    const { analyzeTargetRole } = await import('../services/resumeAI/roleAnalysis.service.js');
    const result = await analyzeTargetRole({
      ...validationResult.data,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: 'Target role analyzed successfully against resume',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Phase 4E: Feature 3 - Dynamic Skill Gap Action Plan Controller
 */
export const generateActionPlanController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = actionPlanSchema.safeParse(req.body);

    if (!validationResult.success) {
      const error: CustomError = new Error(validationResult.error.errors[0].message);
      error.statusCode = 400;
      return next(error);
    }

    const { generateSkillGapActionPlan } = await import('../services/resumeAI/actionPlan.service.js');
    const result = await generateSkillGapActionPlan(validationResult.data);

    return res.status(200).json({
      success: true,
      message: 'Skill gap action plan roadmap generated successfully',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};
