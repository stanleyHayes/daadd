export const INDUSTRIES = [
  { value: 'entertainment', label: 'Entertainment', color: '#8B5CF6', icon: 'Film' },
  { value: 'sports', label: 'Sports', color: '#EF4444', icon: 'Trophy' },
  { value: 'retail', label: 'Retail', color: '#F59E0B', icon: 'ShoppingBag' },
  { value: 'technology', label: 'Technology', color: '#2563EB', icon: 'Cpu' },
  { value: 'food_beverage', label: 'Food & Beverage', color: '#10B981', icon: 'UtensilsCrossed' },
  { value: 'health', label: 'Health', color: '#EC4899', icon: 'Heart' },
  { value: 'finance', label: 'Finance', color: '#14B8A6', icon: 'Landmark' },
  { value: 'travel', label: 'Travel', color: '#6366F1', icon: 'Plane' },
  { value: 'automotive', label: 'Automotive', color: '#78716C', icon: 'Car' },
  { value: 'education', label: 'Education', color: '#0EA5E9', icon: 'GraduationCap' },
] as const;

export const CAMPAIGN_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'suspended', label: 'Suspended' },
] as const;

export const DEVICE_TYPES = [
  { value: 'desktop', label: 'Desktop' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'tablet', label: 'Tablet' },
] as const;

export const LANGUAGES = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Spanish', flag: '🇪🇸' },
  { value: 'fr', label: 'French', flag: '🇫🇷' },
  { value: 'de', label: 'German', flag: '🇩🇪' },
  { value: 'pt', label: 'Portuguese', flag: '🇵🇹' },
  { value: 'it', label: 'Italian', flag: '🇮🇹' },
  { value: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { value: 'zh', label: 'Chinese', flag: '🇨🇳' },
  { value: 'ar', label: 'Arabic', flag: '🇸🇦' },
  { value: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { value: 'ru', label: 'Russian', flag: '🇷🇺' },
  { value: 'ko', label: 'Korean', flag: '🇰🇷' },
  { value: 'pl', label: 'Polish', flag: '🇵🇱' },
  { value: 'tr', label: 'Turkish', flag: '🇹🇷' },
] as const;

export const REGIONS = [
  { value: 'na', label: 'North America' },
  { value: 'eu', label: 'Europe' },
  { value: 'asia', label: 'Asia Pacific' },
  { value: 'latam', label: 'Latin America' },
  { value: 'mena', label: 'Middle East & Africa' },
  { value: 'oceania', label: 'Oceania' },
] as const;

export const ANOMALY_SEVERITY_CONFIG = {
  low: { color: 'blue', label: 'Low' },
  medium: { color: 'yellow', label: 'Medium' },
  high: { color: 'red', label: 'High' },
  critical: { color: 'red', label: 'Critical' },
} as const;

export const INDUSTRY_COLOR_MAP: Record<string, string> = {
  entertainment: 'purple',
  sports: 'red',
  retail: 'yellow',
  technology: 'blue',
  food_beverage: 'green',
  health: 'red',
  finance: 'green',
  travel: 'indigo',
  automotive: 'gray',
  education: 'blue',
};

export const PROGRAMMATIC_PARTNERS = [
  { name: 'The Trade Desk', logo: 'https://placehold.co/160x64/0A2540/FFB81C?text=The+Trade+Desk' },
  { name: 'Google DV360', logo: 'https://placehold.co/160x64/0A2540/FFB81C?text=Google+DV360' },
  { name: 'Amazon DSP', logo: 'https://placehold.co/160x64/0A2540/FFB81C?text=Amazon+DSP' },
  { name: 'StackAdapt', logo: 'https://placehold.co/160x64/0A2540/FFB81C?text=StackAdapt' },
  { name: 'MediaMath', logo: 'https://placehold.co/160x64/0A2540/FFB81C?text=MediaMath' },
  { name: 'PubMatic', logo: 'https://placehold.co/160x64/0A2540/FFB81C?text=PubMatic' },
  { name: 'Magnite', logo: 'https://placehold.co/160x64/0A2540/FFB81C?text=Magnite' },
  { name: 'Criteo', logo: 'https://placehold.co/160x64/0A2540/FFB81C?text=Criteo' },
  { name: 'Adobe Advertising Cloud', logo: 'https://placehold.co/160x64/0A2540/FFB81C?text=Adobe+Ads' },
  { name: 'SmartyAds', logo: 'https://placehold.co/160x64/0A2540/FFB81C?text=SmartyAds' },
] as const;
