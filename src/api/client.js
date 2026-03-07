import axios from "axios";

/**
 * API Client Configuration
 * Uses Authorization header with Bearer token for cross-domain compatibility
 * 
 * Note: Using localStorage for tokens when frontend and backend are on different domains
 * For same-domain deployment, httpOnly cookies are more secure
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  headers: { "Content-Type": "application/json" },
});

console.log("API Client initialized with base URL:", api.defaults.baseURL);

/**
 * Request Interceptor
 * Attaches JWT token to every request if available
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Response Interceptor
 * Handles 401 errors globally by clearing auth data and redirecting to login
 */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem("tf_token");
      localStorage.removeItem("tf_user");
      // Redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export default api;
