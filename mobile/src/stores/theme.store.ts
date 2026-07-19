import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';

type Theme = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  initialize: () => Promise<void>;
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  }
  return theme;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'system',
  resolvedTheme: resolveTheme('system'),
  setTheme: async (theme: Theme) => {
    await AsyncStorage.setItem('daadd-theme', theme);
    set({ theme, resolvedTheme: resolveTheme(theme) });
  },
  initialize: async () => {
    const saved = await AsyncStorage.getItem('daadd-theme') as Theme | null;
    const theme = saved || 'system';
    set({ theme, resolvedTheme: resolveTheme(theme) });

    // Subscribe to system appearance changes
    const subscription = Appearance.addChangeListener(({ colorScheme }: { colorScheme: ColorSchemeName }) => {
      const current = useThemeStore.getState().theme;
      if (current === 'system') {
        set({ resolvedTheme: colorScheme === 'dark' ? 'dark' : 'light' });
      }
    });

    // Store subscription for cleanup (not used in store but prevents leak warning)
    (set as any)._themeSubscription = subscription;
  },
}));
