import axios from 'axios';

/**
 * API Client Configuration
 * Uses httpOnly cookies for authentication (more secure than localStorage)
 * 
 * Security Benefits:
 * - Tokens stored in httpOnly cookies cannot be accessed by JavaScript
 * - Protects against XSS (Cross-Site Scripting) attacks
 * - Automatic cookie management by the browser
 * 
 * Features:
 * - Automatic cookie sending with every request
 * - Global 401 error handling (auto-logout)
 * - CORS support with credentials
 */
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Required to send httpOnly cookies
});

/**
 * Response Interceptor
 * Handles 401 errors globally by clearing user data and redirecting to login
 */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Clear user data from localStorage (not the token, it's in httpOnly cookie)
      localStorage.removeItem('tf_user');
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
