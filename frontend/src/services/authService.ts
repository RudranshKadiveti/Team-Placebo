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

  async forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string; resetToken?: string }>>('/auth/forgot-password', {
      email,
    });
    return response.data.data;
  },

  async resetPassword(data: { email: string; resetToken: string; newPassword: string }): Promise<{ message: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/reset-password', data);
    return { message: response.data.message || 'Password reset successfully' };
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
