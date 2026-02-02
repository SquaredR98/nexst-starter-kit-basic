'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import apiClient from '@/lib/api-client';
import { User, TokenPair, LoginData, RegisterData } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const accessToken = Cookies.get('accessToken');
        if (!accessToken) {
          setLoading(false);
          return;
        }

        const response = await apiClient.get('/users/me');
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (data: LoginData) => {
    try {
      const response = await apiClient.post<TokenPair>('/auth/login', data);
      const { accessToken, refreshToken } = response.data;

      // Store tokens in cookies
      Cookies.set('accessToken', accessToken, { expires: 15 / (24 * 60) }); // 15 minutes
      Cookies.set('refreshToken', refreshToken, { expires: 7 }); // 7 days

      // Fetch user data
      const userResponse = await apiClient.get<User>('/users/me');
      setUser(userResponse.data);

      router.push('/dashboard');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await apiClient.post<TokenPair>('/auth/register', data);
      const { accessToken, refreshToken } = response.data;

      // Store tokens in cookies
      Cookies.set('accessToken', accessToken, { expires: 15 / (24 * 60) }); // 15 minutes
      Cookies.set('refreshToken', refreshToken, { expires: 7 }); // 7 days

      // Fetch user data
      const userResponse = await apiClient.get<User>('/users/me');
      setUser(userResponse.data);

      router.push('/dashboard');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens and user state
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      setUser(null);
      router.push('/auth/login');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.get<User>('/users/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
