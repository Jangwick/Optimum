import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

function getToken(): string | null {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

export const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
  }
);

/**
 * Build an authenticated URL for binary resources (images, documents)
 * that are loaded via <img>, <a download>, etc. and cannot send
 * Authorization headers. Appends the JWT as a query parameter.
 */
export function authUrl(path: string): string {
  const token = getToken();
  const sep = path.includes('?') ? '&' : '?';
  return token ? `${path}${sep}token=${encodeURIComponent(token)}` : path;
}
