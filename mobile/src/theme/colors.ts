export const lightTheme = {
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',

  secondary: '#7C3AED',
  secondaryLight: '#8B5CF6',
  secondaryDark: '#6D28D9',

  accent: '#10B981',
  accentLight: '#34D399',
  accentDark: '#059669',

  warning: '#F59E0B',
  warningLight: '#FBBF24',
  warningDark: '#D97706',

  danger: '#EF4444',
  dangerLight: '#F87171',
  dangerDark: '#DC2626',

  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceSecondary: '#F3F4F6',

  text: {
    primary: '#111827',
    secondary: '#4B5563',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
  },

  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  overlay: 'rgba(0, 0, 0, 0.5)',

  status: {
    pending: '#F59E0B',
    credited: '#10B981',
    redeemed: '#2563EB',
    expired: '#94A3B8',
  },

  gradient: {
    primary: ['#2563EB', '#7C3AED'],
    reward: ['#10B981', '#059669'],
    featured: ['#7C3AED', '#2563EB'],
  },
};

export const darkTheme = {
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',

  secondary: '#8B5CF6',
  secondaryLight: '#A78BFA',
  secondaryDark: '#7C3AED',

  accent: '#34D399',
  accentLight: '#6EE7B7',
  accentDark: '#10B981',

  warning: '#FBBF24',
  warningLight: '#FDE68A',
  warningDark: '#F59E0B',

  danger: '#F87171',
  dangerLight: '#FCA5A5',
  dangerDark: '#EF4444',

  background: '#0F172A',
  surface: '#1E293B',
  surfaceSecondary: '#334155',

  text: {
    primary: '#F1F5F9',
    secondary: '#CBD5E1',
    tertiary: '#64748B',
    inverse: '#0F172A',
  },

  border: '#334155',
  borderLight: '#1E293B',

  overlay: 'rgba(0, 0, 0, 0.7)',

  status: {
    pending: '#FBBF24',
    credited: '#34D399',
    redeemed: '#3B82F6',
    expired: '#64748B',
  },

  gradient: {
    primary: ['#3B82F6', '#8B5CF6'],
    reward: ['#34D399', '#10B981'],
    featured: ['#8B5CF6', '#3B82F6'],
  },
};

// Default export for backward compatibility
export const colors = lightTheme;

export type ThemeColors = typeof lightTheme;
