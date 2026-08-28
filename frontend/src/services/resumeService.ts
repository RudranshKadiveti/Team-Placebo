import { apiClient } from './api';

export interface AtsScore {
  overallScore: number;
  pointBreakdown: {
    sectionPoints: number;
    formattingPoints: number;
    keywordPoints: number;
    lostSectionPoints: number;
    lostFormattingPoints: number;
    lostKeywordPoints: number;
  };
  semanticMatch: {
    score: number;
    similarityPercent: number;
  };
  formattingCheck: {
    passed: boolean;
    issues: string[];
  };
  sectionCompleteness: {
    score: number;
    missingSections: string[];
  };
  readability: {
    status: 'Poor' | 'Moderate' | 'Optimal';
    suggestions: string[];
  };
  actionableSuggestions: string[];
}

export interface ResumeMetadata {
  id: string;
  userId: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  storageKey: string;
  atsScore?: AtsScore;
  uploadedAt: string;
  updatedAt: string;
}

export interface GetResumesResponse {
  success: boolean;
  data: ResumeMetadata[];
}

export interface GetResumeByIdResponse {
  success: boolean;
  data: ResumeMetadata;
}

export const resumeService = {
  getResumes: async (): Promise<GetResumesResponse> => {
    const response = await apiClient.get<GetResumesResponse>('/resumes');
    return response.data;
  },

  getResumeById: async (id: string): Promise<GetResumeByIdResponse> => {
    const response = await apiClient.get<GetResumeByIdResponse>(`/resumes/${id}`);
    return response.data;
  },

  uploadResume: async (file: File): Promise<{ success: boolean; data: ResumeMetadata }> => {
    const formData = new FormData();
    formData.append('resume', file);

    const response = await apiClient.post<{ success: boolean; data: ResumeMetadata }>(
      '/resumes/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  scoreResume: async (id: string): Promise<{ success: boolean; data: AtsScore }> => {
    const response = await apiClient.post<{ success: boolean; data: AtsScore }>(`/resumes/${id}/score`);
    return response.data;
  },

  parseResume: async (id: string): Promise<{ success: boolean; data: any }> => {
    const response = await apiClient.post<{ success: boolean; data: any }>(`/resumes/${id}/parse`);
    return response.data;
  },
};
