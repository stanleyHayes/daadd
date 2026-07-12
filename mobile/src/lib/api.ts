import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getToken, removeToken } from './storage';
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

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await removeToken();
      // Clear auth state to force re-login
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
