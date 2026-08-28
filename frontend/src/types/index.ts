export interface HealthCheckState {
  backend: 'Connected' | 'Disconnected' | 'Checking...';
  database: 'Connected' | 'Disconnected' | 'Checking...';
  message?: string;
  loading: boolean;
  error?: string;
}
