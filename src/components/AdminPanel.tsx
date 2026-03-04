import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, LayoutDashboard, Film, Users, CreditCard, Check, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Category, Content, AdminMetrics } from '../types';

interface AdminPanelProps {
  onClose: () => void;
  token: string;
}

export default function AdminPanel({ onClose, token }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'content' | 'users' | 'plans'>('dashboard');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [contentList, setContentList] = useState<Content[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentContent, setCurrentContent] = useState<Partial<Content>>({
    title: '',
    description: '',
    category_id: 1,
    thumbnail: '',
    video_url: '',
    audio_url: '',
  });

  useEffect(() => {
    fetchMetrics();
    fetchCategories();
    fetchContent();
  }, []);

  const fetchMetrics = async () => {
    const res = await fetch('/api/admin/metrics', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setMetrics(await res.json());
  };

  const fetchCategories = async () => {
    const res = await fetch('/api/categories');
    if (res.ok) setCategories(await res.json());
  };

  const fetchContent = async () => {
    const res = await fetch('/api/content');
    if (res.ok) setContentList(await res.json());
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = currentContent.id ? 'PUT' : 'POST';
    const url = currentContent.id ? `/api/admin/content/${currentContent.id}` : '/api/admin/content';
    
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(currentContent)
    });

    if (res.ok) {
      setIsEditing(false);
      setCurrentContent({ title: '', description: '', category_id: 1, thumbnail: '', video_url: '', audio_url: '', tags: '' });
      fetchContent();
      fetchMetrics();
    }
  };

  const handleDeleteContent = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este conteúdo?')) {
      const res = await fetch(`/api/admin/content/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchContent();
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-fiat-bg flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-fiat-card">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-fiat-blue rounded-full flex items-center justify-center border border-fiat-gold">
            <span className="text-fiat-gold font-serif font-bold text-lg">F</span>
          </div>
          <h1 className="text-xl font-serif font-bold gold-text">Painel Administrativo</h1>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/10 bg-fiat-card hidden md:block">
          <nav className="p-4 space-y-2">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-fiat-blue text-white' : 'hover:bg-white/5 text-gray-400'}`}
            >
              <LayoutDashboard className="w-5 h-5" /> Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('content')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'content' ? 'bg-fiat-blue text-white' : 'hover:bg-white/5 text-gray-400'}`}
            >
              <Film className="w-5 h-5" /> Conteúdos
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-fiat-blue text-white' : 'hover:bg-white/5 text-gray-400'}`}
            >
              <Users className="w-5 h-5" /> Usuários
            </button>
            <button 
              onClick={() => setActiveTab('plans')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'plans' ? 'bg-fiat-blue text-white' : 'hover:bg-white/5 text-gray-400'}`}
            >
              <CreditCard className="w-5 h-5" /> Planos
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-fiat-bg">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif font-bold mb-6">Visão Geral</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-fiat-card p-6 rounded-2xl border border-white/10">
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Total de Usuários</p>
                  <p className="text-4xl font-bold">{metrics?.users || 0}</p>
                </div>
                <div className="bg-fiat-card p-6 rounded-2xl border border-white/10">
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Conteúdos Ativos</p>
                  <p className="text-4xl font-bold">{metrics?.content || 0}</p>
                </div>
                <div className="bg-fiat-card p-6 rounded-2xl border border-white/10">
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Favoritos Totais</p>
                  <p className="text-4xl font-bold">{metrics?.favorites || 0}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif font-bold">Gerenciar Conteúdos</h2>
                <button 
                  onClick={() => { setIsEditing(true); setCurrentContent({ title: '', description: '', category_id: 1, thumbnail: '', video_url: '', audio_url: '' }); }}
                  className="bg-fiat-blue hover:bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-5 h-5" /> Novo Conteúdo
                </button>
              </div>

              {isEditing ? (
                <motion.form 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleSaveContent}
                  className="bg-fiat-card p-8 rounded-2xl border border-white/10 space-y-4 max-w-3xl"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Título</label>
                      <input 
                        type="text" 
                        required
                        value={currentContent.title}
                        onChange={e => setCurrentContent({...currentContent, title: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-fiat-gold"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Descrição</label>
                      <textarea 
                        rows={3}
                        value={currentContent.description}
                        onChange={e => setCurrentContent({...currentContent, description: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-fiat-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Categoria</label>
                      <select 
                        value={currentContent.category_id}
                        onChange={e => setCurrentContent({...currentContent, category_id: parseInt(e.target.value)})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-fiat-gold"
                      >
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Thumbnail (URL)</label>
                      <input 
                        type="text" 
                        value={currentContent.thumbnail}
                        onChange={e => setCurrentContent({...currentContent, thumbnail: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-fiat-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Vídeo (URL)</label>
                      <input 
                        type="text" 
                        value={currentContent.video_url}
                        onChange={e => setCurrentContent({...currentContent, video_url: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-fiat-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Áudio (URL)</label>
                      <input 
                        type="text" 
                        value={currentContent.audio_url}
                        onChange={e => setCurrentContent({...currentContent, audio_url: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-fiat-gold"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tags (separadas por vírgula)</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Bíblia, Oração, Jovens"
                        value={currentContent.tags}
                        onChange={e => setCurrentContent({...currentContent, tags: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-fiat-gold"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-4 mt-6">
                    <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 rounded-lg hover:bg-white/5">Cancelar</button>
                    <button type="submit" className="bg-fiat-blue px-6 py-2 rounded-lg font-bold">Salvar Alterações</button>
                  </div>
                </motion.form>
              ) : (
                <div className="bg-fiat-card rounded-2xl border border-white/10 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Conteúdo</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Categoria</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {contentList.map(item => (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={item.thumbnail} className="w-16 aspect-video rounded object-cover" referrerPolicy="no-referrer" />
                              <div>
                                <p className="font-bold">{item.title}</p>
                                <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-fiat-gold">{item.category_name}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${item.is_active ? 'bg-emerald-500/20 text-emerald-500' : 'bg-fiat-red/20 text-fiat-red'}`}>
                              {item.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => { setIsEditing(true); setCurrentContent(item); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteContent(item.id)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-fiat-red"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
