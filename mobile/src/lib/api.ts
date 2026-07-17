import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getToken, getRefreshToken, setToken, setRefreshToken } from './storage';
import { useAuthStore } from '@/stores/auth.store';

import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 for host localhost, iOS simulator uses localhost
const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://${DEFAULT_HOST}:4000/api/v1`;

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Auth endpoints whose 401s should not trigger a token refresh
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

// Single-flight refresh: concurrent 401s share one refresh request
let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    const { token, refreshToken: newRefreshToken } = res.data.data;
    await setToken(token);
    if (newRefreshToken) await setRefreshToken(newRefreshToken);
    return true;
  } catch {
    return false;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const isAuthRequest = AUTH_ENDPOINTS.some((path) =>
      originalRequest?.url?.includes(path)
    );

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;
      refreshPromise = refreshPromise ?? refreshTokens();
      const refreshed = await refreshPromise;
      refreshPromise = null;

      if (refreshed) {
        // Retry the original request; the request interceptor attaches the new token
        return api(originalRequest);
      }
    }

    if (error.response?.status === 401) {
      // Clear auth state to force re-login; the root layout redirects to (auth)/login
      await useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
