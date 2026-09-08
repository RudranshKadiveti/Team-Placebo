import { Request, Response } from 'express';
import { JobSearchService } from '../services/jobSearch.service.js';
import { CareerRoadmapService } from '../services/careerRoadmap.service.js';
import { extractUserProfile } from '../services/roadmap/profileNormalizer.js';
import { prisma } from '../config/database.js';

export class CareerController {
  /**
   * Search for jobs based on a target role and user's profile context.
   */
  static async searchJobs(req: Request, res: Response) {
    try {
      const { targetRole, region } = req.body;

      if (!targetRole || !targetRole.trim()) {
        return res.status(400).json({ error: 'targetRole is required' });
      }

      const jobs = await JobSearchService.searchJobs(targetRole, region || 'Worldwide');
      res.status(200).json({ jobs });
    } catch (error: any) {
      console.error('[CareerController] searchJobs error:', error);
      res.status(500).json({ error: 'Failed to search jobs' });
    }
  }

  /**
   * Generate or retrieve a roadmap for a specific job.
   */
  static async generateAndSaveRoadmap(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Missing User Session' });
      }

      const { jobId, job, forceRegenerate, targetRole, jobTitle, jobDescription, targetCompany, jobUrl } = req.body;

      // Normalize job payload whether sent as job object or raw parameters
      const normalizedJob = {
        id: jobId || job?.id,
        title: job?.title || jobTitle || targetRole,
        company: job?.company || targetCompany || 'Tech Employer',
        description: job?.description || jobDescription || '',
        skills: job?.skills || [],
        url: job?.url || jobUrl || ''
      };

      if (!normalizedJob.title) {
        return res.status(400).json({ error: 'Job title or target role is required' });
      }

      // Check if user has uploaded resume or connected GitHub profile
      const profileData = await extractUserProfile(userId);
      if (!profileData.hasProfileData) {
        return res.status(400).json({
          success: false,
          missingProfileData: true,
          missingResume: !profileData.hasResume,
          missingGithub: !profileData.hasGithub,
          message: 'Please upload your resume or connect your GitHub profile to generate a personalized learning roadmap.'
        });
      }

      const roadmap = await CareerRoadmapService.getOrGenerateRoadmap(
        userId,
        normalizedJob,
        Boolean(forceRegenerate)
      );

      res.status(200).json({
        success: true,
        roadmap
      });
    } catch (error: any) {
      console.error('[CareerController] generateAndSaveRoadmap error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate roadmap' });
    }
  }

  /**
   * Get all saved roadmaps for the user.
   */
  static async getSavedRoadmaps(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const roadmaps = await prisma.careerRoadmap.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' }
      });

      res.status(200).json({ roadmaps });
    } catch (error: any) {
      console.error('[CareerController] getSavedRoadmaps error:', error);
      res.status(500).json({ error: 'Failed to fetch roadmaps' });
    }
  }
}
