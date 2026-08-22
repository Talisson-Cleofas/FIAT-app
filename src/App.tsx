import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { HelpCircle, MessageSquare, Phone, Volume2, VolumeX } from 'lucide-react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ContentRow from './components/ContentRow';
import Player from './components/Player';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import { supabase } from './lib/supabase';
import { Category, Content, User } from './types';
import { offlineService, OfflineContent } from './services/offlineService';
import { getProfile, listCategories, listContent, listUserContent, saveHistory, toggleFavorite } from './services/supabaseService';

const verse = {
  verse: 'Eis aqui a serva do Senhor; faça-se em mim segundo a tua palavra.',
  reference: 'Lucas 1,38',
  reflection: 'O fiat de Maria nos ensina a responder a Deus com confiança, liberdade e disponibilidade.'
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [activeContent, setActiveContent] = useState<Content | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [history, setHistory] = useState<Content[]>([]);
  const [favorites, setFavorites] = useState<Content[]>([]);
  const [downloads, setDownloads] = useState<OfflineContent[]>([]);
  const [currentView, setCurrentView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const loadPublicData = async () => {
    try {
      const [categoryItems, contentItems, downloadedItems] = await Promise.all([
        listCategories(), listContent(), offlineService.getAllDownloaded()
      ]);
      setCategories(categoryItems);
      setContent(contentItems);
      setDownloads(downloadedItems);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar os conteúdos. Verifique a configuração do Supabase.');
    }
  };

  const loadMemberData = async (uid: string) => {
    const [historyItems, favoriteItems] = await Promise.all([
      listUserContent(uid, 'history'), listUserContent(uid, 'favorites')
    ]);
    setHistory(historyItems);
    setFavorites(favoriteItems);
  };

  useEffect(() => {
    loadPublicData();
    const syncUser = async (authUser: { id: string; email?: string; user_metadata?: { name?: string } } | null) => {
      try {
        if (!authUser) {
          setUser(null);
          setHistory([]);
          setFavorites([]);
          return;
        }
        const profile = await getProfile(authUser.id);
        setUser(profile || { id: authUser.id, name: authUser.user_metadata?.name || 'Membro FIAT', email: authUser.email || '', role: 'user' });
        await loadMemberData(authUser.id);
      } finally {
        setAuthReady(true);
      }
    };
    supabase.auth.getSession().then(({ data }) => syncUser(data.session?.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => syncUser(session?.user || null));
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    setShowAuth(false);
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) throw new Error(error.message);
    setShowAuth(false);
  };

  const handleToggleFavorite = async (item: Content) => {
    if (!user) return setShowAuth(true);
    const isFavorite = favorites.some(favorite => favorite.id === item.id);
    await toggleFavorite(user.id, item, !isFavorite);
    await loadMemberData(user.id);
  };

  const handleUpdateProgress = async (progress: number) => {
    if (user && activeContent) await saveHistory(user.id, activeContent, progress);
  };

  const filteredContent = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    if (!search) return content;
    return content.filter(item => `${item.title} ${item.description} ${item.tags || ''}`.toLowerCase().includes(search));
  }, [content, searchQuery]);

  if (!authReady) return <div className="min-h-screen grid place-items-center text-fiat-gold">Carregando FIAT...</div>;

  const row = (title: string, items: Content[]) => <ContentRow title={title} items={items} onPlay={setActiveContent} favorites={favorites} onToggleFavorite={handleToggleFavorite} downloads={downloads} />;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} onLogout={() => { supabase.auth.signOut(); }} onOpenAuth={() => setShowAuth(true)} onOpenAdmin={() => setShowAdmin(true)} onSearch={setSearchQuery} currentView={currentView} onViewChange={setCurrentView} onSubscribe={() => alert('Os planos serão conectados na próxima etapa.')} />
      <main className="flex-1">
        {error && <div className="pt-24 px-4 max-w-7xl mx-auto text-red-300">{error}</div>}
        {currentView === 'home' && <Hero content={filteredContent[0] || null} onPlay={setActiveContent} favorites={favorites} onToggleFavorite={handleToggleFavorite} />}
        <div className={`relative z-20 pb-20 ${currentView === 'home' ? '-mt-16 sm:-mt-32' : 'pt-28'}`}>
          {currentView === 'home' && <>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-fiat-blue/40 backdrop-blur-xl border border-fiat-gold/30 rounded-2xl p-6 sm:p-10 flex flex-col md:flex-row items-center gap-8 shadow-2xl"><div className="w-20 h-20 bg-fiat-gold/10 rounded-full grid place-items-center border border-fiat-gold/30"><span className="text-fiat-gold font-serif font-bold text-4xl">†</span></div><div className="flex-1 text-center md:text-left"><p className="text-fiat-gold text-xs font-bold uppercase tracking-[0.3em] mb-2">Versículo do Dia</p><h3 className="text-xl sm:text-2xl font-serif italic mb-2">“{verse.verse}”</h3><p className="text-fiat-gold font-bold text-sm mb-4">— {verse.reference}</p><p className="text-gray-300">{verse.reflection}</p></div></motion.div></div>
            {searchQuery ? row(`Resultados para “${searchQuery}”`, filteredContent) : <>{history.length > 0 && row('Continuar assistindo', history)}{categories.map(category => <div key={category.id}>{row(category.name, content.filter(item => item.category_id === category.id))}</div>)}</>}
          </>}
          {currentView === 'explore' && categories.map(category => <div key={category.id}>{row(category.name, content.filter(item => item.category_id === category.id))}</div>)}
          {currentView === 'mylist' && row('Continuar assistindo', history)}
          {currentView === 'favorites' && row('Meus favoritos', favorites)}
          {currentView === 'offline' && row('Conteúdo offline', downloads)}
          {currentView === 'support' && <div className="max-w-5xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-8"><div className="bg-fiat-card border border-white/10 rounded-2xl p-8"><HelpCircle className="text-fiat-gold mb-4" /><h2 className="text-2xl font-serif font-bold mb-4">Perguntas frequentes</h2><p className="text-gray-400">Acesse em qualquer celular, tablet ou computador. Sua conta e seu progresso ficam sincronizados.</p></div><div className="bg-fiat-card border border-white/10 rounded-2xl p-8"><Phone className="text-fiat-gold mb-4" /><h2 className="text-2xl font-serif font-bold mb-4">Suporte</h2><p className="text-gray-400 flex gap-2"><MessageSquare /> Configure aqui o WhatsApp e o e-mail oficiais do projeto.</p></div></div>}
        </div>
      </main>
      <button onClick={() => setIsMusicPlaying(!isMusicPlaying)} className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full grid place-items-center shadow-2xl border-2 ${isMusicPlaying ? 'bg-fiat-gold text-black border-white' : 'bg-fiat-blue text-fiat-gold border-fiat-gold'}`}>{isMusicPlaying ? <Volume2 /> : <VolumeX />}</button>
      <footer className="bg-fiat-card border-t border-white/10 py-10 px-4 text-center text-sm text-gray-500">© {new Date().getFullYear()} FIAT · Plataforma Católica Digital</footer>
      <AnimatePresence>
        {activeContent && <Player content={activeContent} onClose={() => { setActiveContent(null); if (user) loadMemberData(user.id); }} onProgress={handleUpdateProgress} />}
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} onRegister={handleRegister} />}
        {showAdmin && user?.role === 'admin' && <AdminPanel onClose={() => { setShowAdmin(false); loadPublicData(); }} />}
      </AnimatePresence>
    </div>
  );
}
