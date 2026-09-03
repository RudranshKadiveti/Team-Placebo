import { Request, Response } from 'express';
import { JobSearchService } from '../services/jobSearch.service.js';
import { CareerRoadmapService } from '../services/careerRoadmap.service.js';
import { prisma } from '../config/database.js';

export class CareerController {
  /**
   * Search for jobs based on a target role and user's profile context.
   */
  static async searchJobs(req: Request, res: Response) {
    try {
      const { targetRole, region } = req.body;
      const userId = (req as any).user?.userId;

      if (!targetRole) {
        return res.status(400).json({ error: 'targetRole is required' });
      }

      // We could optionally fetch the user's profile to extract skills and filter jobs better,
      // but for now, we just pass the role and region to the job search engine.
      const jobs = await JobSearchService.searchJobs(targetRole, region || 'Worldwide');

      res.status(200).json({ jobs });
    } catch (error: any) {
      console.error('[CareerController] searchJobs error:', error);
      res.status(500).json({ error: 'Failed to search jobs' });
    }
  }

  /**
   * Generate a roadmap for a specific job and save it to the DB.
   */
  static async generateAndSaveRoadmap(req: Request, res: Response) {
    try {
      const { targetRole, jobTitle, jobDescription, targetCompany, jobUrl } = req.body;
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!targetRole || !jobTitle || !jobDescription) {
        return res.status(400).json({ error: 'targetRole, jobTitle, and jobDescription are required' });
      }

      // Fetch user's latest parsed resume for skills
      const latestResume = await prisma.resume.findFirst({
        where: { userId },
        orderBy: { uploadedAt: 'desc' },
      });
      
      let userSkills: string[] = [];
      if (latestResume && latestResume.structuredContent) {
        try {
          const parsed = JSON.parse(latestResume.structuredContent);
          userSkills = parsed.skills || [];
        } catch (e) {
          // ignore parsing error
        }
      }

      // Fetch user's github skills
      const githubConnection = await prisma.gitHubConnection.findUnique({
        where: { userId },
        include: { repos: true }
      });
      
      let githubSkills: string[] = [];
      if (githubConnection && githubConnection.repos) {
        const skillsSet = new Set<string>();
        githubConnection.repos.forEach(repo => {
          if (repo.primaryLanguage) skillsSet.add(repo.primaryLanguage);
          if (repo.topicsJson) {
            try {
              const topics = JSON.parse(repo.topicsJson);
              topics.forEach((t: string) => skillsSet.add(t));
            } catch (e) {}
          }
        });
        githubSkills = Array.from(skillsSet);
      }

      // Generate Roadmap
      const roadmapContent = await CareerRoadmapService.generateRoadmap(
        targetRole,
        jobTitle,
        jobDescription,
        userSkills,
        githubSkills
      );

      // Save Roadmap
      const savedRoadmap = await CareerRoadmapService.saveRoadmap(
        userId,
        targetRole,
        targetCompany || 'Unknown Company',
        jobUrl || '',
        roadmapContent
      );

      res.status(200).json({ roadmap: savedRoadmap });
    } catch (error: any) {
      console.error('[CareerController] generateAndSaveRoadmap error:', error);
      res.status(500).json({ error: 'Failed to generate roadmap' });
    }
  }

  /**
   * Get all saved roadmaps for the user.
   */
  static async getSavedRoadmaps(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const roadmaps = await prisma.careerRoadmap.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({ roadmaps });
    } catch (error: any) {
      console.error('[CareerController] getSavedRoadmaps error:', error);
      res.status(500).json({ error: 'Failed to fetch roadmaps' });
    }
  }
}
