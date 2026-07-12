import { useThemeStore } from '../stores/theme.store';
import { lightTheme, darkTheme } from '../theme/colors';

export function useColors() {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  return resolvedTheme === 'dark' ? darkTheme : lightTheme;
}
