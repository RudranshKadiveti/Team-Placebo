export interface HealthCheckResponse {
  success: boolean;
  message: string;
  database: 'connected' | 'disconnected';
  timestamp?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
  };
}
