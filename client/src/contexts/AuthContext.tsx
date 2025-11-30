import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export type UserRole = 'student' | 'teacher' | 'admin' | '';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear corrupted data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      // Real authentication via API Gateway
      // Use Vite env var if available, fall back to localhost gateway
      const API_BASE = (import.meta as any)?.env?.VITE_API_BASE ?? 'http://localhost:8888';

      // UserService expects { username, password }
  const payload = { username, password };

      const response = await axios.post(`${API_BASE}/api/users/auth/login`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      const apiResp = response.data;
      const token: string | undefined = apiResp?.result?.token;
      if (!token) {
        throw new Error(apiResp?.message || 'No token returned from server');
      }

      // Save token
      localStorage.setItem('token', token);

      // Decode JWT payload to build minimal user object
      const decodeJWT = (t: string) => {
        try {
          const payloadPart = t.split('.')[1];
          const decoded = atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'));
          return JSON.parse(decoded);
        } catch (err) {
          console.error('Failed to decode JWT', err);
          return null;
        }
      };

      const decoded = decodeJWT(token) || {};
      const rawRole = decoded.role || decoded.roles || '';
      const normalizedRole = rawRole ? String(rawRole).toLowerCase() as User['role'] : '';

      // Prefer explicit userId claim (UUID) when present. Fall back to sub for legacy tokens.
      const builtUser: User = {
        id: decoded.userId || decoded.sub || decoded.id || 'unknown',
        email: decoded.email || username,
        name: decoded.name || decoded.fullName || decoded.username || username,
        role: normalizedRole,
        avatar: decoded.avatar || undefined
      };

      localStorage.setItem('user', JSON.stringify(builtUser));
      setUser(builtUser);

      // If user has no role yet, send them to choose-role flow
      if (builtUser.role === '') {
        navigate('/choose-role');
      } else {
        // Redirect based on role
        switch (builtUser.role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'teacher':
            navigate('/teacher');
            break;
          case 'student':
            navigate('/student');
            break;
          default:
            navigate('/');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      // Try to extract message from axios error
      const msg = (error as any)?.response?.data?.message || (error as any)?.message || 'Login failed. Please check your credentials.';
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Utility function to get role display name
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'teacher':
      return 'Teacher';
    case 'student':
      return 'Student';
    default:
      return 'User';
  }
}

// Utility function to get role color
export function getRoleColor(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800';
    case 'teacher':
      return 'bg-blue-100 text-blue-800';
    case 'student':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}