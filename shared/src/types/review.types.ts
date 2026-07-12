export interface Review {
  id: string;
  user_id: string;
  campaign_id: string;
  redemption_id: string | null;
  rating: number;
  comment: string | null;
  expectation: string | null;
  reality: string | null;
  created_at: Date;
}

export interface ReviewSummary {
  average_rating: number;
  total_reviews: number;
  distribution: Record<number, number>;
}

export interface SubmitReviewRequest {
  campaign_id: string;
  rating: number;
  comment?: string;
  expectation?: string;
  reality?: string;
  redemption_id?: string;
}
