export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Content {
  id: string;
  title: string;
  description: string;
  category_id: string;
  category_name?: string;
  thumbnail: string;
  video_url?: string;
  audio_url?: string;
  is_active: boolean;
  published_at: string;
  progress?: number;
  views?: number;
  tags?: string;
  media_type?: 'video' | 'audio';
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
