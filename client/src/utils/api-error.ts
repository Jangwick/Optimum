import { AxiosError } from 'axios';

export type ApiErrorKind = 'auth' | 'network' | 'server' | 'client' | 'unknown';

export interface ClassifiedApiError {
  kind: ApiErrorKind;
  message: string;
}

export function classifyApiError(error: unknown): ClassifiedApiError {
  if (error instanceof AxiosError) {
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return { kind: 'network', message: 'Network error. Please check your connection.' };
    }

    const status = error.response.status;

    if (status === 401) {
      return { kind: 'auth', message: 'Unauthorized. Please log in again.' };
    }

    if (status >= 500) {
      return { kind: 'server', message: 'Server error. Please try again later.' };
    }

    if (status >= 400) {
      return { kind: 'client', message: 'Request failed. Please check your input.' };
    }
  }

  if (error instanceof Error) {
    return { kind: 'unknown', message: error.message };
  }

  return { kind: 'unknown', message: 'An unknown error occurred' };
}
