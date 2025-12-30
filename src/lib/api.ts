import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
});

/* =========================
   REQUEST INTERCEPTOR
   Attach Bearer Token
========================= */
api.interceptors.request.use(
  (config) => {
    // ✅ Prevent SSR crash (Next.js)
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('token');

      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
