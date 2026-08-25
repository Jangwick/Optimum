import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!config.headers['x-request-id']) {
    config.headers['x-request-id'] = generateRequestId();
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const isAuth = error.config?.url?.startsWith('/auth');
    const onLogin = window.location.pathname === '/login';
    if (error.response?.status === 401 && !isAuth && !onLogin) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
