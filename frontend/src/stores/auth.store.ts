import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setTokens: (token: string, refreshToken: string) => void;
}

const storedToken = localStorage.getItem('daadd_token');
const storedRefreshToken = localStorage.getItem('daadd_refresh_token');
const storedUserStr = localStorage.getItem('daadd_user');
let storedUser: User | null = null;
if (storedUserStr) {
  try {
    storedUser = JSON.parse(storedUserStr);
  } catch {
    storedUser = null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: storedUser,
  token: storedToken,
  refreshToken: storedRefreshToken,
  isAuthenticated: !!storedToken && !!storedUser,

  login: (user: User, token: string, refreshToken: string) => {
    localStorage.setItem('daadd_token', token);
    localStorage.setItem('daadd_refresh_token', refreshToken);
    localStorage.setItem('daadd_user', JSON.stringify(user));
    set({ token, refreshToken, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('daadd_token');
    localStorage.removeItem('daadd_refresh_token');
    localStorage.removeItem('daadd_user');
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false });
  },

  setUser: (user: User) => {
    localStorage.setItem('daadd_user', JSON.stringify(user));
    set({ user });
  },

  setTokens: (token: string, refreshToken: string) => {
    localStorage.setItem('daadd_token', token);
    localStorage.setItem('daadd_refresh_token', refreshToken);
    set({ token, refreshToken });
  },
}));
