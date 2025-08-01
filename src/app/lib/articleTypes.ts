export type Article = {
  id: string;
  title: string;
  description: string;
  title_en?: string;
  title_pl?: string;
  description_en?: string;
  description_pl?: string;
  image_url: string;
  credibility_score: number;
  trend: string;
  source: string;
  publishedAt: string;
  created_at: string;
}; 