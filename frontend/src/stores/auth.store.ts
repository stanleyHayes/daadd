import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

const storedToken = localStorage.getItem('adplatform_token');
const storedUserStr = localStorage.getItem('adplatform_user');
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
  isAuthenticated: !!storedToken && !!storedUser,

  login: (user: User, token: string) => {
    localStorage.setItem('adplatform_token', token);
    localStorage.setItem('adplatform_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('adplatform_token');
    localStorage.removeItem('adplatform_user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  setUser: (user: User) => {
    localStorage.setItem('adplatform_user', JSON.stringify(user));
    set({ user });
  },
}));
