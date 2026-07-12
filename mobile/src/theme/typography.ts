import { TextStyle } from 'react-native';

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  display: 36,
} as const;

export const fontFamily = {
  light: 'EuclidA-Light',
  regular: 'EuclidA-Regular',
  medium: 'EuclidA-Medium',
  semibold: 'EuclidA-Semibold',
  bold: 'EuclidA-Bold',
  extrabold: 'EuclidA-Bold',
  black: 'EuclidA-Bold',
} as const;

export const fontWeight: Record<string, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const typography: Record<string, TextStyle> = {
  displayLarge: {
    fontSize: fontSize.display,
    fontFamily: fontFamily.extrabold,
    lineHeight: 44,
  },
  displaySmall: {
    fontSize: fontSize.xxxl,
    fontFamily: fontFamily.bold,
    lineHeight: 36,
  },
  headingLarge: {
    fontSize: fontSize.xxl,
    fontFamily: fontFamily.bold,
    lineHeight: 28,
  },
  headingMedium: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.semibold,
    lineHeight: 24,
  },
  headingSmall: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semibold,
    lineHeight: 22,
  },
  bodyLarge: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.regular,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    lineHeight: 16,
  },
  caption: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.medium,
    lineHeight: 14,
  },
  button: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semibold,
    lineHeight: 22,
  },
  buttonSmall: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semibold,
    lineHeight: 18,
  },
} as const;
