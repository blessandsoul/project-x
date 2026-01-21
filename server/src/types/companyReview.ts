export interface CompanyReview {
  id: number;
  company_id: number;
  user_id: number;
  user_name?: string | null;
  avatar?: string | null;
  rating: number; // 1-10
  comment: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CompanyReviewCreate {
  company_id: number;
  user_id: number;
  rating: number;
  comment?: string | null;
}

export interface CompanyReviewUpdate {
  rating?: number;
  comment?: string | null;
}
