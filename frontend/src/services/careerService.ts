import { apiClient } from './api';

export interface JobListing {
  id: string;
  title: string;
  company: string;
  url: string;
  location: string;
  salary: string;
  description: string;
  source: string;
  tags?: string[];
  skills?: string[];
}

export interface JobAnalysis {
  role: string;
  readinessPercentage: number;
  summary: string;
  keyStrengths: string[];
  whyThisRoadmap?: string;
}

export interface MatchedSkill {
  skill: string;
  evidence: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface SkillGap {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  jobEvidence?: string;
  currentLevel?: 'none' | 'beginner' | 'intermediate' | 'advanced';
  targetLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export interface Resource {
  title: string;
  url?: string;
  type: 'documentation' | 'tutorial' | 'course' | 'article' | 'book';
}

export interface Milestone {
  order: number;
  title: string;
  reason: string;
  skillsCovered: string[];
  estimatedTime: string;
  prerequisites: string[];
  topics: string[];
  project: string;
  resources: Resource[];
}

export interface FinalAssessment {
  biggestGap: string;
  mostImportantNextStep: string;
  estimatedTimeToBecomeCompetitive: string;
}

export interface GeneratedRoadmap {
  jobAnalysis: JobAnalysis;
  matchedSkills: MatchedSkill[];
  skillGaps: SkillGap[];
  learningPath: Milestone[];
  finalAssessment: FinalAssessment;
}

export interface CareerRoadmapRecord {
  id: string;
  userId: string;
  jobId?: string;
  targetRole: string;
  jobTitle?: string;
  targetCompany?: string;
  jobUrl?: string;
  roadmapContent: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapResponse {
  success: boolean;
  roadmap?: GeneratedRoadmap;
  missingProfileData?: boolean;
  missingResume?: boolean;
  missingGithub?: boolean;
  message?: string;
}

export const careerService = {
  /**
   * Search for remote jobs matching the target role
   */
  async searchJobs(targetRole: string, region: string = 'Worldwide'): Promise<JobListing[]> {
    const response = await apiClient.post<{ jobs: JobListing[] }>('/career/jobs', {
      targetRole,
      region,
    });
    return response.data.jobs;
  },

  /**
   * Generate or retrieve cached AI roadmap for a specific job
   */
  async generateRoadmap(
    job: JobListing,
    forceRegenerate: boolean = false
  ): Promise<RoadmapResponse> {
    try {
      const response = await apiClient.post<RoadmapResponse>('/career/roadmap', {
        jobId: job.id,
        job,
        forceRegenerate
      });
      return response.data;
    } catch (err: any) {
      if (err.response && err.response.data) {
        return err.response.data;
      }
      throw err;
    }
  },

  /**
   * Get all previously saved career roadmaps
   */
  async getSavedRoadmaps(): Promise<CareerRoadmapRecord[]> {
    const response = await apiClient.get<{ roadmaps: CareerRoadmapRecord[] }>('/career/roadmap');
    return response.data.roadmaps;
  }
};
