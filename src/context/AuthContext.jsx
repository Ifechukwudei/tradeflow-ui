/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";

/**
 * Authentication Context
 * Manages user authentication state using localStorage (for cross-domain deployment)
 * 
 * Note: For production on same domain, consider using httpOnly cookies instead
 */
const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * Wraps the application to provide authentication context to all child components
 */
export const AuthProvider = ({ children }) => {
  // Initialize user state from localStorage
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("tf_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Initialize token state from localStorage
  const [token, setToken] = useState(() => localStorage.getItem("tf_token"));

  /**
   * Login function
   * Stores both user data and token in localStorage
   * 
   * @param {Object} userData - User information (id, username, email, role, etc.)
   * @param {string} tokenData - JWT authentication token
   */
  const login = (userData, tokenData) => {
    localStorage.setItem("tf_token", tokenData);
    localStorage.setItem("tf_user", JSON.stringify(userData));
    setToken(tokenData);
    setUser(userData);
  };

  /**
   * Logout function
   * Clears user data and token from both state and localStorage
   */
  const logout = () => {
    localStorage.removeItem("tf_token");
    localStorage.removeItem("tf_user");
    setToken(null);
    setUser(null);
  };

  // Sync token changes with localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem("tf_token", token);
    } else {
      localStorage.removeItem("tf_token");
    }
  }, [token]);

  // Sync user changes with localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("tf_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("tf_user");
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 * Custom hook to access authentication context
 * @returns {Object} Authentication context with user, token, login, and logout
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
