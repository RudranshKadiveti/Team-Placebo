import { apiClient } from './api';

export interface ResumeMetadata {
  id: string;
  userId: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  storageKey: string;
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
};
