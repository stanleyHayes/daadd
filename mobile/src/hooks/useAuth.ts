import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { AuthResponse, LoginCredentials, RegisterCredentials, User } from '@/types';

export function useLogin() {
  const { login } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      const res = await api.post('/auth/login', credentials);
      // Backend wraps in { success, data, message }
      return res.data.data;
    },
    onSuccess: async (data) => {
      await login(data.user, data.token, data.refreshToken);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useRegister() {
  const { login } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
      const res = await api.post('/auth/register', credentials);
      return res.data.data;
    },
    onSuccess: async (data) => {
      await login(data.user, data.token, data.refreshToken);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useCurrentUser() {
  const { isAuthenticated, setUser } = useAuthStore();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<User> => {
      const res = await api.get('/auth/me');
      const user = res.data.data;
      setUser(user);
      return user;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return async () => {
    await logout();
    queryClient.clear();
  };
}

export function useUpdateProfile() {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { name?: string; avatar_url?: string }): Promise<User> => {
      const res = await api.patch('/auth/me', updates);
      return res.data.data;
    },
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (passwords: {
      currentPassword: string;
      newPassword: string;
    }): Promise<void> => {
      await api.patch('/auth/change-password', passwords);
    },
  });
}
