import { apiClient } from './api';

export interface GitHubStatus {
  connected: boolean;
  username?: string;
  connectedAt?: string;
  lastSyncedAt?: string;
  lastAnalyzedAt?: string;
  repoCount?: number;
}

export interface AnalyzedRepo {
  githubRepoId: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  defaultBranch: string;
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  size: number;
  stargazersCount: number;
  forksCount: number;
  openIssuesCount: number;
  primaryLanguage: string | null;
  topics: string[];
  languages: Record<string, number>;
  technologies: Array<{ name: string; category: string; confidence: string }>;
  classification: string;
  relevanceScore: number;
  complexityScore: number;
  healthScore: number;
  documentationScore: number;
  testingScore: number;
  cicdScore: number;
}

export interface PortfolioData {
  portfolio: {
    portfolioStrengthScore: number;
    technicalDepthScore: number;
    projectQualityScore: number;
    engineeringPracticesScore: number;
    documentationScore: number;
    testingScore: number;
    maintenanceScore: number;
    totalRepositoriesCount: number;
    analyzedRepositoriesCount: number;
    topLanguages: Array<{ language: string; percentage: number }>;
    detectedTechnologies: Array<{ name: string; category: string; confidence: string }>;
    strengths: string[];
    improvements: string[];
  };
  skillMatrix: Array<{
    skill: string;
    category: 'Strong Evidence' | 'Moderate Evidence' | 'GitHub Only' | 'Resume Only';
    repoCount: number;
    evidenceRepos: string[];
    recommendation: string;
  }>;
  topRepositories: AnalyzedRepo[];
}

export interface RepositoryDetailResponse {
  repository: AnalyzedRepo;
  analysis: Record<string, any>;
  bullets: string[];
}

export const githubService = {
  async getStatus(): Promise<GitHubStatus> {
    const response = await apiClient.get<{ success: boolean; data: GitHubStatus }>('/github/status');
    return response.data.data;
  },

  async connect(username: string, accessToken?: string): Promise<{ username: string; message: string }> {
    const response = await apiClient.post<{ success: boolean; data: { username: string; message: string } }>('/github/connect', {
      username,
      accessToken,
    });
    return response.data.data;
  },

  async sync(): Promise<{ syncedCount: number; message: string }> {
    const response = await apiClient.post<{ success: boolean; data: { syncedCount: number; message: string } }>('/github/sync');
    return response.data.data;
  },

  async getPortfolio(): Promise<PortfolioData> {
    const response = await apiClient.get<{ success: boolean; data: PortfolioData }>('/github/portfolio');
    return response.data.data;
  },

  async getRepositoryDetail(id: string): Promise<RepositoryDetailResponse> {
    const response = await apiClient.get<{ success: boolean; data: RepositoryDetailResponse }>(`/github/repositories/${id}`);
    return response.data.data;
  },

  async disconnect(): Promise<void> {
    await apiClient.delete('/github/disconnect');
  },
};
