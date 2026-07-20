import { create } from 'zustand';
import { User } from '@/types';
import { setToken, setRefreshToken, getToken, clearAuth } from '@/lib/storage';
import { disconnectSocket } from '@/lib/socket';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (user: User, token: string, refreshToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (user: User, token: string, refreshToken?: string) => {
    await setToken(token);
    if (refreshToken) {
      await setRefreshToken(refreshToken);
    }
    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    disconnectSocket();
    await clearAuth();
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (user: User) => {
    set({ user });
  },

  updateUser: (updates: Partial<User>) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    }));
  },

  initialize: async () => {
    try {
      const token = await getToken();
      if (token) {
        set({ token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
