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

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
