import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
});

api.interceptors.request.use(
  config => {
    if (typeof window !== 'undefined') {
      const token =
        sessionStorage.getItem('token') ||
        localStorage.getItem('token');

      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  error => Promise.reject(error)
);

api.interceptors.response.use(
  response => response,
  error => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || '');

    if (
      typeof window !== 'undefined' &&
      status === 401 &&
      !requestUrl.includes('/auth/loginUser') &&
      !requestUrl.includes('/auth/logoutUser')
    ) {
      sessionStorage.clear();
      localStorage.clear();

      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
