export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Content {
  id: number;
  title: string;
  description: string;
  category_id: number;
  category_name?: string;
  thumbnail: string;
  video_url?: string;
  audio_url?: string;
  is_active: number;
  published_at: string;
  progress?: number;
  views?: number;
  tags?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AdminMetrics {
  users: number;
  content: number;
  favorites: number;
}
