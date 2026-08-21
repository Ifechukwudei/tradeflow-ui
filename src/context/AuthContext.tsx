'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tenant, User } from '@/types/auth';
import { AuthService } from '@/lib/services/auth.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  tenant: Tenant | null;
  loading: boolean;
  login: (user: User, token: string, tenant?: Tenant) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('tf_token');
      const savedUser = localStorage.getItem('tf_user');
      const savedTenant = localStorage.getItem('tf_tenant');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        if (savedTenant) {
          setTenant(JSON.parse(savedTenant));
        }
      }
    } catch {
      localStorage.removeItem('tf_token');
      localStorage.removeItem('tf_user');
      localStorage.removeItem('tf_tenant');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData: User, tokenData: string, tenantData?: Tenant) => {
    setToken(tokenData);
    setUser(userData);
    localStorage.setItem('tf_token', tokenData);
    localStorage.setItem('tf_user', JSON.stringify(userData));

    if (tenantData) {
      setTenant(tenantData);
      localStorage.setItem('tf_tenant', JSON.stringify(tenantData));
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch {
      // ignore
    } finally {
      setToken(null);
      setUser(null);
      setTenant(null);
      localStorage.removeItem('tf_token');
      localStorage.removeItem('tf_user');
      localStorage.removeItem('tf_tenant');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  const refreshUser = async () => {
    try {
      const updatedUser = await AuthService.getMe();
      setUser(updatedUser);
      localStorage.setItem('tf_user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        tenant,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
