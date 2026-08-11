import { apiClient } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthData {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: {
    message: string;
  };
}

export const authService = {
  async register(name: string, email: string, password: string): Promise<AuthData> {
    const response = await apiClient.post<ApiResponse<AuthData>>('/auth/register', {
      name,
      email,
      password,
    });
    return response.data.data;
  },

  async login(email: string, password: string): Promise<AuthData> {
    const response = await apiClient.post<ApiResponse<AuthData>>('/auth/login', {
      email,
      password,
    });
    return response.data.data;
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data.data.user;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network failures on logout
    }
  },
};
