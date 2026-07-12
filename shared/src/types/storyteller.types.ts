export enum StoryChapter {
  FIRST_IMPRESSION = 'FIRST_IMPRESSION',
  RIPPLE_EFFECT = 'RIPPLE_EFFECT',
  PEAK_MOMENTS = 'PEAK_MOMENTS',
  CONVERSION_TRAIL = 'CONVERSION_TRAIL',
}

export interface Visualization {
  type: string;
  data: Record<string, unknown>;
  config?: Record<string, unknown>;
}

export interface StoryChapterData {
  chapter: StoryChapter;
  title: string;
  description: string;
  data: Record<string, unknown>;
  visualizations: Visualization[];
}

export interface AdJourneyStory {
  campaign_id: string;
  generated_at: Date;
  chapters: StoryChapterData[];
  key_insights: string[];
  recommendations: string[];
  is_preliminary: boolean;
}
