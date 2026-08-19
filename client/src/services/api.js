import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
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
