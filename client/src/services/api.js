import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

function getToken() {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuth = error.config?.url?.startsWith('/auth');
    const onLogin = window.location.pathname === '/login';
    if (error.response?.status === 401 && !isAuth && !onLogin) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
