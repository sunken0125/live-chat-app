"use client";

import { useContext, createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from "next/navigation";
import api from '../lib/api';

interface AuthContextType {
  accessToken: string | null | undefined;
  login: (username: string, password: string) => Promise<void>;
  refreshAccessToken: () => Promise<string>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await api.post('/refresh-token');
        setAccessToken(res.data.accessToken);
      } catch (err) {
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, []);

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const skipRefreshEndpoints = ['/login', '/register'];

        if (error.response?.status === 401 && !originalRequest._retry && !skipRefreshEndpoints.includes(originalRequest.url)) {
          originalRequest._retry = true;

          try {
            const res = await api.post('/refresh-token');
            const newAccessToken = res.data.accessToken;
            setAccessToken(newAccessToken);
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            setAccessToken(null);
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken]);

  const login = async (username: string, password: string) => {
    const response = await api.post('/login', { username, password });
    setAccessToken(response.data.accessToken);
  };

  const refreshAccessToken = async () => {
    const res = await api.post('/refresh-token');
    const newToken = res.data.accessToken;
    setAccessToken(newToken);
    return newToken;
  };

  const logout = async () => {
    await api.post('/logout');
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ accessToken, login, refreshAccessToken, logout, loading }}>
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { accessToken, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && accessToken === null) {
      router.push('/login');
    }
  }, [accessToken, loading, router]);

  if (loading || accessToken === null) return null;

  return <>{children}</>;
};