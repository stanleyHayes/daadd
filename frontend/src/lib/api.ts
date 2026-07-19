import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import type { ApiResponse } from '@/types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('daadd_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Single-flight token refresh: concurrent 401s share one in-flight request.
let refreshPromise: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    const storedRefreshToken = localStorage.getItem('daadd_refresh_token');
    if (!storedRefreshToken) {
      return Promise.resolve(null);
    }
    refreshPromise = api
      .post<ApiResponse<{ token: string; refreshToken: string }>>('/auth/refresh', { refreshToken: storedRefreshToken })
      .then((res) => {
        const { token, refreshToken } = res.data.data;
        useAuthStore.getState().setTokens(token, refreshToken);
        return token;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const url: string = error.config?.url || '';
      // Don't hijack the login/register responses themselves — their 401 is
      // "bad credentials" and the form should surface it inline. Also skip
      // when already on an auth page so we don't reload and wipe form state.
      const isAuthEndpoint = /\/auth\/(login|register|refresh)/.test(url);
      const onAuthPage = /^\/(login|register)/.test(window.location.pathname);
      const originalConfig = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

      if (!isAuthEndpoint && !onAuthPage && originalConfig && !originalConfig._retry) {
        originalConfig._retry = true;
        const newToken = await refreshAccessToken();
        if (newToken) {
          originalConfig.headers.Authorization = `Bearer ${newToken}`;
          return api(originalConfig);
        }
      }

      if (!isAuthEndpoint && !onAuthPage) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
