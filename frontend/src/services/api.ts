import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to automatically append Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('careerpilot_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface HealthStatusResponse {
  success: boolean;
  message: string;
  database: 'connected' | 'disconnected';
}

export const fetchHealthStatus = async (): Promise<HealthStatusResponse> => {
  const response = await apiClient.get<HealthStatusResponse>('/health');
  return response.data;
};
