import { apiClient } from './api';

export type ExperienceLevel = 'STUDENT' | 'ENTRY_LEVEL' | 'JUNIOR' | 'MID_LEVEL' | 'SENIOR';

export interface Profile {
  id: string;
  userId: string;
  phone?: string | null;
  location?: string | null;
  university?: string | null;
  degree?: string | null;
  fieldOfStudy?: string | null;
  graduationYear?: number | null;
  experienceLevel?: ExperienceLevel | null;
  bio?: string | null;
  createdAt: string;
  updatedAt: string;
  careerGoals?: CareerGoal[];
}

export interface CareerGoal {
  id: string;
  profileId: string;
  targetRole: string;
  targetIndustry?: string | null;
  targetLocation?: string | null;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileResponse {
  profile: Profile | null;
  completionPercentage: number;
}

export const profileService = {
  async getProfile(): Promise<ProfileResponse> {
    const response = await apiClient.get<{ success: boolean; data: ProfileResponse }>('/profile');
    return response.data.data;
  },

  async createProfile(data: Partial<Profile>): Promise<ProfileResponse> {
    const response = await apiClient.post<{ success: boolean; data: ProfileResponse }>('/profile', data);
    return response.data.data;
  },

  async updateProfile(data: Partial<Profile>): Promise<ProfileResponse> {
    const response = await apiClient.put<{ success: boolean; data: ProfileResponse }>('/profile', data);
    return response.data.data;
  },

  async deleteProfile(): Promise<void> {
    await apiClient.delete('/profile');
  },

  async getCareerGoals(): Promise<CareerGoal[]> {
    const response = await apiClient.get<{ success: boolean; data: CareerGoal[] }>('/profile/career-goals');
    return response.data.data;
  },

  async createCareerGoal(data: {
    targetRole: string;
    targetIndustry?: string;
    targetLocation?: string;
    priority?: number;
  }): Promise<CareerGoal> {
    const response = await apiClient.post<{ success: boolean; data: CareerGoal }>('/profile/career-goals', data);
    return response.data.data;
  },

  async updateCareerGoal(
    id: string,
    data: {
      targetRole?: string;
      targetIndustry?: string;
      targetLocation?: string;
      priority?: number;
    }
  ): Promise<CareerGoal> {
    const response = await apiClient.put<{ success: boolean; data: CareerGoal }>(`/profile/career-goals/${id}`, data);
    return response.data.data;
  },

  async deleteCareerGoal(id: string): Promise<void> {
    await apiClient.delete(`/profile/career-goals/${id}`);
  },
};
