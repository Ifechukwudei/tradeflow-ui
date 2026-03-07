/**
 * Token Manager
 * Handles secure token storage and validation
 */

const TOKEN_KEY = 'tf_token';
const USER_KEY = 'tf_user';

/**
 * Store token securely
 * Note: In production, consider encrypting the token before storing
 */
export const setToken = (token) => {
    if (!token) return;
    localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Get token from storage
 */
export const getToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};

/**
 * Remove token from storage
 */
export const removeToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

/**
 * Check if token is expired
 * JWT tokens have 3 parts: header.payload.signature
 */
export const isTokenExpired = (token) => {
    if (!token) return true;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000; // Convert to milliseconds
        return Date.now() >= exp;
    } catch (error) {
        console.error('Error parsing token:', error);
        return true;
    }
};

/**
 * Validate token before using
 */
export const isTokenValid = () => {
    const token = getToken();
    if (!token) return false;
    return !isTokenExpired(token);
};
