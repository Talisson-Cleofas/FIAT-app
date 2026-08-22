import { supabase } from '../lib/supabase';
import { Category, Content, User } from '../types';

export const fallbackCategories: Category[] = [
  { id: 'a-jornada', name: 'FIAT A Jornada', slug: 'a-jornada' },
  { id: 'eclesia', name: 'FIAT Eclésia', slug: 'eclesia' },
  { id: 'hesed', name: 'FIAT Hesed', slug: 'hesed' },
  { id: 'young', name: 'FIAT Young', slug: 'young' },
  { id: 'podcast', name: 'FIAT Podcast', slug: 'podcast' },
];

const fail = (error: { message: string } | null) => { if (error) throw new Error(error.message); };
const mapContent = (row: any): Content => ({
  ...row,
  category_name: row.category_name || row.categories?.name || '',
  is_active: Boolean(row.is_active),
  published_at: row.published_at || new Date().toISOString()
});

export async function getProfile(uid: string): Promise<User | null> {
  const { data, error } = await supabase.from('profiles').select('id,name,email,role').eq('id', uid).maybeSingle();
  fail(error); return data as User | null;
}

export async function createProfile(uid: string, name: string, email: string) {
  const { error } = await supabase.from('profiles').upsert({ id: uid, name, email, role: 'user' }, { onConflict: 'id' });
  fail(error);
}

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  fail(error); return data?.length ? data as Category[] : fallbackCategories;
}

export async function listContent(includeInactive = false): Promise<Content[]> {
  let request = supabase.from('content').select('*, categories(name)').order('published_at', { ascending: false });
  if (!includeInactive) request = request.eq('is_active', true);
  const { data, error } = await request;
  fail(error); return (data || []).map(mapContent);
}

export async function saveContent(content: Partial<Content>) {
  const payload = {
    title: content.title?.trim(), description: content.description?.trim() || '',
    category_id: content.category_id, thumbnail: content.thumbnail?.trim(),
    video_url: content.video_url?.trim() || '', audio_url: content.audio_url?.trim() || '',
    media_type: content.media_type || (content.audio_url ? 'audio' : 'video'),
    tags: content.tags?.trim() || '', is_active: content.is_active ?? true,
    updated_at: new Date().toISOString()
  };
  if (content.id) {
    const { error } = await supabase.from('content').update(payload).eq('id', content.id); fail(error); return;
  }
  const { error } = await supabase.from('content').insert(payload); fail(error);
}

export async function removeContent(id: string) {
  const { error } = await supabase.from('content').delete().eq('id', id); fail(error);
}

export async function listUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('profiles').select('id,name,email,role').order('name');
  fail(error); return (data || []) as User[];
}

export async function setUserRole(uid: string, role: User['role']) {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', uid); fail(error);
}

export async function listUserContent(uid: string, bucket: 'favorites' | 'history'): Promise<Content[]> {
  const select = bucket === 'history' ? 'progress, updated_at, content(*, categories(name))' : 'content(*, categories(name))';
  const { data, error } = await supabase.from(bucket).select(select).eq('user_id', uid);
  fail(error);
  return (data || []).map((row: any) => mapContent({ ...row.content, progress: row.progress }));
}

export async function toggleFavorite(uid: string, content: Content, active: boolean) {
  const request = active
    ? supabase.from('favorites').upsert({ user_id: uid, content_id: content.id })
    : supabase.from('favorites').delete().eq('user_id', uid).eq('content_id', content.id);
  const { error } = await request; fail(error);
}

export async function saveHistory(uid: string, content: Content, progress: number) {
  const { error } = await supabase.from('history').upsert({
    user_id: uid, content_id: content.id, progress, updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,content_id' });
  fail(error);
}
