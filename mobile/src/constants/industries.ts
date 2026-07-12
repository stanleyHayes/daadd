import { Industry } from '@/types';

export const industries: Industry[] = [
  { id: 'technology', label: 'Technology', icon: 'laptop', color: '#2563EB' },
  { id: 'food_beverage', label: 'Food & Beverage', icon: 'restaurant', color: '#F59E0B' },
  { id: 'fashion', label: 'Fashion', icon: 'shirt-outline', color: '#EC4899' },
  { id: 'health', label: 'Health', icon: 'fitness', color: '#10B981' },
  { id: 'finance', label: 'Finance', icon: 'card', color: '#6366F1' },
  { id: 'entertainment', label: 'Entertainment', icon: 'game-controller', color: '#8B5CF6' },
  { id: 'travel', label: 'Travel', icon: 'airplane', color: '#06B6D4' },
  { id: 'education', label: 'Education', icon: 'school', color: '#F97316' },
  { id: 'sports', label: 'Sports', icon: 'football', color: '#EF4444' },
  { id: 'automotive', label: 'Automotive', icon: 'car-sport', color: '#64748B' },
  { id: 'real_estate', label: 'Real Estate', icon: 'home', color: '#84CC16' },
  { id: 'retail', label: 'Retail', icon: 'bag-handle', color: '#D946EF' },
];

export const getIndustryById = (id: string): Industry | undefined =>
  industries.find((i) => i.id === id);
