export interface HealthResponse {
  status: string;
  timestamp: string;
  env: string;
  seeded: {
    users: number;
    roles: number;
    claimStatuses: number;
    processStatuses: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}
