import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('tf_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (typeof window !== 'undefined' && err.response?.status === 401) {
      // Don't auto-redirect if already on login page
      if (!window.location.pathname.startsWith('/login')) {
        localStorage.removeItem('tf_token');
        localStorage.removeItem('tf_user');
        localStorage.removeItem('tf_tenant');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
