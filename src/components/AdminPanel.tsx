import { FormEvent, useEffect, useState } from 'react';
import { Check, Edit2, Film, LayoutDashboard, Plus, Trash2, Users, X } from 'lucide-react';
import { Category, Content, User } from '../types';
import { listCategories, listContent, listUsers, removeContent, saveContent, setUserRole } from '../services/supabaseService';

interface Props { onClose: () => void }

const emptyContent: Partial<Content> = {
  title: '', description: '', category_id: 'a-jornada', category_name: 'FIAT A Jornada',
  thumbnail: '', video_url: '', audio_url: '', media_type: 'video', tags: '', is_active: true
};

export default function AdminPanel({ onClose }: Props) {
  const [tab, setTab] = useState<'dashboard' | 'content' | 'users'>('dashboard');
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Content[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Content>>(emptyContent);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    const [categoryItems, contentItems, userItems] = await Promise.all([listCategories(), listContent(true), listUsers()]);
    setCategories(categoryItems); setItems(contentItems); setUsers(userItems);
  };
  useEffect(() => { load().catch(console.error); }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.video_url && !form.audio_url) return setMessage('Informe o link do vídeo ou do áudio.');
    setSaving(true); setMessage('');
    try {
      await saveContent(form);
      setEditing(false); setForm(emptyContent); setMessage('Conteúdo salvo com sucesso.'); await load();
    } catch (error) { console.error(error); setMessage('Não foi possível salvar. Verifique suas permissões.'); }
    finally { setSaving(false); }
  };

  const pickCategory = (id: string) => {
    const category = categories.find(item => item.id === id);
    setForm(current => ({ ...current, category_id: id, category_name: category?.name || '' }));
  };

  return <div className="fixed inset-0 z-[120] bg-fiat-bg flex flex-col">
    <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-fiat-card"><h1 className="text-xl font-serif font-bold gold-text">Painel Administrativo</h1><button onClick={onClose}><X /></button></header>
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-64 border-r border-white/10 bg-fiat-card hidden md:block p-4 space-y-2">
        <button onClick={() => setTab('dashboard')} className={`admin-nav ${tab === 'dashboard' ? 'bg-fiat-blue text-white' : ''}`}><LayoutDashboard /> Dashboard</button>
        <button onClick={() => setTab('content')} className={`admin-nav ${tab === 'content' ? 'bg-fiat-blue text-white' : ''}`}><Film /> Conteúdos</button>
        <button onClick={() => setTab('users')} className={`admin-nav ${tab === 'users' ? 'bg-fiat-blue text-white' : ''}`}><Users /> Membros</button>
      </aside>
      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="md:hidden flex gap-2 mb-6"><button onClick={() => setTab('dashboard')}>Resumo</button><button onClick={() => setTab('content')}>Conteúdos</button><button onClick={() => setTab('users')}>Membros</button></div>
        {message && <p className="mb-4 rounded-xl border border-fiat-gold/30 bg-fiat-gold/10 p-3 text-sm">{message}</p>}
        {tab === 'dashboard' && <><h2 className="text-3xl font-serif font-bold mb-8">Visão geral</h2><div className="grid sm:grid-cols-3 gap-5">{[['Membros', users.length], ['Conteúdos', items.length], ['Publicados', items.filter(item => item.is_active).length]].map(([label, value]) => <div key={String(label)} className="bg-fiat-card border border-white/10 rounded-2xl p-6"><p className="text-gray-400">{label}</p><p className="text-4xl font-bold gold-text mt-2">{value}</p></div>)}</div><div className="mt-8 bg-fiat-card border border-white/10 rounded-2xl p-6"><h3 className="font-bold mb-2">Mídia sem pesar no aplicativo</h3><p className="text-gray-400">Cadastre apenas links. Para vídeo, use YouTube não listado, Vimeo ou Cloudflare Stream. Para áudio, use Supabase Storage, Cloudinary ou Cloudflare R2 com URL pública.</p></div></>}
        {tab === 'content' && <><div className="flex items-center justify-between mb-8"><h2 className="text-3xl font-serif font-bold">Conteúdos</h2><button onClick={() => { setForm(emptyContent); setEditing(true); }} className="bg-fiat-blue border border-fiat-gold/30 px-4 py-2 rounded-xl flex gap-2"><Plus /> Novo</button></div>
          {editing ? <form onSubmit={submit} className="max-w-3xl bg-fiat-card border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4"><label>Título<input required value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} className="admin-input" /></label><label>Categoria<select value={form.category_id} onChange={e => pickCategory(e.target.value)} className="admin-input">{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label></div>
            <label>Descrição<textarea required value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="admin-input min-h-28" /></label>
            <label>Imagem de capa (URL)<input required type="url" value={form.thumbnail || ''} onChange={e => setForm({ ...form, thumbnail: e.target.value })} className="admin-input" placeholder="https://.../capa.jpg" /></label>
            <div className="grid sm:grid-cols-2 gap-4"><label>Tipo<select value={form.media_type} onChange={e => setForm({ ...form, media_type: e.target.value as 'video' | 'audio' })} className="admin-input"><option value="video">Vídeo</option><option value="audio">Áudio</option></select></label><label>Tags<input value={form.tags || ''} onChange={e => setForm({ ...form, tags: e.target.value })} className="admin-input" /></label></div>
            {form.media_type === 'video' ? <label>Link do vídeo<input required type="url" value={form.video_url || ''} onChange={e => setForm({ ...form, video_url: e.target.value, audio_url: '' })} className="admin-input" placeholder="YouTube não listado, Vimeo ou MP4 CDN" /></label> : <label>Link do áudio<input required type="url" value={form.audio_url || ''} onChange={e => setForm({ ...form, audio_url: e.target.value, video_url: '' })} className="admin-input" placeholder="MP3/AAC hospedado externamente" /></label>}
            <label className="flex gap-2"><input type="checkbox" checked={form.is_active ?? true} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Publicado</label>
            <div className="flex gap-3"><button disabled={saving} className="bg-fiat-blue px-5 py-3 rounded-xl flex gap-2"><Check /> {saving ? 'Salvando...' : 'Salvar'}</button><button type="button" onClick={() => setEditing(false)}>Cancelar</button></div>
          </form> : <div className="space-y-3">{items.map(item => <div key={item.id} className="bg-fiat-card border border-white/10 rounded-xl p-4 flex items-center gap-4"><img src={item.thumbnail} className="w-28 aspect-video object-cover rounded-lg" /><div className="flex-1"><p className="font-bold">{item.title}</p><p className="text-xs text-gray-400">{item.category_name} · {item.media_type === 'audio' ? 'Áudio' : 'Vídeo'} · {item.is_active ? 'Publicado' : 'Rascunho'}</p></div><button onClick={() => { setForm(item); setEditing(true); }}><Edit2 /></button><button className="text-red-400" onClick={async () => { if (confirm('Excluir este conteúdo?')) { await removeContent(item.id); await load(); } }}><Trash2 /></button></div>)}</div>}
        </>}
        {tab === 'users' && <><h2 className="text-3xl font-serif font-bold mb-8">Membros</h2><div className="space-y-3">{users.map(member => <div key={member.id} className="bg-fiat-card border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4"><div><p className="font-bold">{member.name}</p><p className="text-sm text-gray-400">{member.email}</p></div><select value={member.role} onChange={async e => { await setUserRole(member.id, e.target.value as User['role']); await load(); }} className="admin-input max-w-36"><option value="user">Membro</option><option value="admin">Administrador</option></select></div>)}</div></>}
      </main>
    </div>
  </div>;
}
