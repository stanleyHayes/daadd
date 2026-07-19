import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = 'daadd-theme';

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  return stored === 'dark' || stored === 'light' ? stored : 'light';
};

const applyTheme = (theme: Theme) => {
  localStorage.setItem(STORAGE_KEY, theme);
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

const initialTheme = getInitialTheme();
applyTheme(initialTheme);

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: initialTheme,
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      applyTheme(newTheme);
      return { theme: newTheme };
    }),
  setTheme: (theme: Theme) => {
    applyTheme(theme);
    set({ theme });
  },
}));
