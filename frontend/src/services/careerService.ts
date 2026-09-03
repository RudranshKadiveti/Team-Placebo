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
}

export interface CareerRoadmap {
  id: string;
  userId: string;
  targetRole: string;
  targetCompany?: string;
  jobUrl?: string;
  roadmapContent: string;
  createdAt: string;
  updatedAt: string;
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
   * Generate an AI roadmap for a specific job and save it
   */
  async generateRoadmap(
    targetRole: string,
    jobTitle: string,
    jobDescription: string,
    targetCompany: string,
    jobUrl: string
  ): Promise<CareerRoadmap> {
    const response = await apiClient.post<{ roadmap: CareerRoadmap }>('/career/roadmap', {
      targetRole,
      jobTitle,
      jobDescription,
      targetCompany,
      jobUrl,
    });
    return response.data.roadmap;
  },

  /**
   * Get all previously saved career roadmaps
   */
  async getSavedRoadmaps(): Promise<CareerRoadmap[]> {
    const response = await apiClient.get<{ roadmaps: CareerRoadmap[] }>('/career/roadmap');
    return response.data.roadmaps;
  },
};
