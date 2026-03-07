/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import { getMe } from "../api/auth";

/**
 * Authentication Context
 * Manages user authentication state using httpOnly cookies
 * 
 * Security Note:
 * - JWT tokens are stored in httpOnly cookies (not localStorage)
 * - Only user data is stored in localStorage for UI purposes
 * - Tokens cannot be accessed by JavaScript, preventing XSS attacks
 */
const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * Wraps the application to provide authentication context to all child components
 * 
 * Features:
 * - Persists user data in localStorage (for UI display only)
 * - Token is managed by httpOnly cookies (more secure)
 * - Automatically restores session on page reload
 * - Verifies authentication status on app load
 */
export const AuthProvider = ({ children }) => {
  // Initialize user state from localStorage (only user data, not token)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("tf_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(true);

  /**
   * Check authentication status on app load
   * Verifies if the stored token is still valid
   */
  useEffect(() => {
    const checkAuth = async () => {
      const savedUser = localStorage.getItem("tf_user");
      if (savedUser) {
        try {
          // Verify token is still valid by calling /me endpoint
          const response = await getMe();
          setUser(response.data.data);
        } catch (error) {
          // Token is invalid or expired, clear localStorage
          localStorage.removeItem("tf_user");
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  /**
   * Login function
   * Stores user data in localStorage
   * Token is automatically stored in httpOnly cookie by the backend
   * 
   * @param {Object} userData - User information (id, username, email, role, etc.)
   */
  const login = (userData) => {
    localStorage.setItem("tf_user", JSON.stringify(userData));
    setUser(userData);
  };

  /**
   * Logout function
   * Clears user data from localStorage
   * Cookie is cleared by calling the backend logout endpoint
   */
  const logout = () => {
    localStorage.removeItem("tf_user");
    setUser(null);
  };

  // Sync user changes with localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("tf_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("tf_user");
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 * Custom hook to access authentication context
 * @returns {Object} Authentication context with user, login, logout, and loading
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
