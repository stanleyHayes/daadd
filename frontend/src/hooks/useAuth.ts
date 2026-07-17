import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { User, ApiResponse } from '@/types';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: string;
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export function useLogin() {
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: async (data: LoginPayload) => {
      const res = await api.post<ApiResponse<LoginResponse>>('/auth/login', data);
      return res.data.data;
    },
    onSuccess: (data) => {
      login(data.user, data.token, data.refreshToken);
    },
  });
}

export function useRegister() {
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: async (data: RegisterPayload) => {
      const res = await api.post<ApiResponse<LoginResponse>>('/auth/register', data);
      return res.data.data;
    },
    onSuccess: (data) => {
      login(data.user, data.token, data.refreshToken);
    },
  });
}

export function useCurrentUser() {
  const query = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<User>>('/auth/me');
      return res.data.data;
    },
    retry: false,
  });

  // Sync auth store with query result to prevent desync
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  // Sync auth store with query result to prevent desync
  React.useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
    if (query.error) {
      logout();
    }
  }, [query.data, query.error, setUser, logout]);

  return query;
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: async (data: Partial<User>) => {
      const res = await api.patch<ApiResponse<User>>('/auth/me', data);
      return res.data.data;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      const res = await api.patch('/auth/change-password', { currentPassword, newPassword });
      return res.data;
    },
  });
}
