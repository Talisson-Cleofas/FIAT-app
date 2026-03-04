import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Volume2, VolumeX, HelpCircle, Phone, MessageSquare } from 'lucide-react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ContentRow from './components/ContentRow';
import Player from './components/Player';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import PricingModal from './components/PricingModal';
import { User, Category, Content } from './types';
import { offlineService, OfflineContent } from './services/offlineService';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('fiat_token'));
  const [categories, setCategories] = useState<Category[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [activeContent, setActiveContent] = useState<Content | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [history, setHistory] = useState<Content[]>([]);
  const [favorites, setFavorites] = useState<Content[]>([]);
  const [downloads, setDownloads] = useState<OfflineContent[]>([]);
  const [currentView, setCurrentView] = useState('home');
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  const [dailyVerse, setDailyVerse] = useState<{ verse: string; reference: string; reflection: string } | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchContent();
    fetchDailyVerse();
    fetchDownloads();
    
    // Check payment status from URL
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('payment');
    if (status) {
      setPaymentStatus(status);
      // Remove param from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (token) {
      const savedUser = localStorage.getItem('fiat_user');
      if (savedUser) setUser(JSON.parse(savedUser));
      fetchUserData();
    }
  }, [token]);

  const fetchDailyVerse = async () => {
    const res = await fetch('/api/daily-verse');
    if (res.ok) setDailyVerse(await res.json());
  };

  const fetchCategories = async () => {
    const res = await fetch('/api/categories');
    if (res.ok) setCategories(await res.json());
  };

  const fetchContent = async () => {
    const res = await fetch('/api/content');
    if (res.ok) setContent(await res.json());
  };

  const fetchUserData = async () => {
    if (!token) return;
    const [histRes, favRes] = await Promise.all([
      fetch('/api/user/history', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/user/favorites', { headers: { Authorization: `Bearer ${token}` } })
    ]);
    if (histRes.ok) setHistory(await histRes.json());
    if (favRes.ok) setFavorites(await favRes.json());
    fetchDownloads();
  };

  const fetchDownloads = async () => {
    const items = await offlineService.getAllDownloaded();
    setDownloads(items);
  };

  const handleLogin = async (email: string, pass: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    if (res.ok) {
      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('fiat_token', data.token);
      localStorage.setItem('fiat_user', JSON.stringify(data.user));
      setShowAuth(false);
    } else {
      throw new Error('Credenciais inválidas');
    }
  };

  const handleRegister = async (name: string, email: string, pass: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: pass })
    });
    if (!res.ok) throw new Error('Erro ao cadastrar. Email já existe?');
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('fiat_token');
    localStorage.removeItem('fiat_user');
    setHistory([]);
    setFavorites([]);
  };

  const handleSubscribe = async (planType: 'monthly' | 'yearly' = 'monthly') => {
    if (!token) {
      setShowAuth(true);
      return;
    }
    try {
      const res = await fetch('/api/payment/create-preference', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ planType })
      });
      if (res.ok) {
        const { init_point } = await res.json();
        window.location.href = init_point;
      } else {
        alert('Erro ao iniciar pagamento. Verifique se o Mercado Pago está configurado.');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao conectar com o servidor de pagamentos.');
    }
  };

  const handleUpdateProgress = async (progress: number) => {
    if (!token || !activeContent) return;
    await fetch('/api/user/history', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ content_id: activeContent.id, progress })
    });
  };

  const handleToggleFavorite = async (item: Content) => {
    if (!token) {
      setShowAuth(true);
      return;
    }
    const isFav = favorites.some(f => f.id === item.id);
    const method = isFav ? 'DELETE' : 'POST';
    const res = await fetch(`/api/user/favorites/${item.id}`, {
      method,
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      fetchUserData();
    }
  };

  const [searchQuery, setSearchQuery] = useState('');

  const filteredContent = useMemo(() => {
    if (!searchQuery) return content;
    return content.filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [content, searchQuery]);

  const heroContent = useMemo(() => {
    return filteredContent.length > 0 ? filteredContent[0] : null;
  }, [filteredContent]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onOpenAuth={() => setShowAuth(true)} 
        onOpenAdmin={() => setShowAdmin(true)}
        onSearch={setSearchQuery}
        currentView={currentView}
        onViewChange={setCurrentView}
        onSubscribe={() => setShowPricing(true)}
      />

      <main className="flex-1">
        {paymentStatus && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 -mb-16">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border flex items-center justify-between ${
                paymentStatus === 'success' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500' : 
                paymentStatus === 'failure' ? 'bg-fiat-red/20 border-fiat-red/50 text-fiat-red' : 
                'bg-fiat-gold/20 border-fiat-gold/50 text-fiat-gold'
              }`}
            >
              <p className="font-bold">
                {paymentStatus === 'success' ? 'Pagamento realizado com sucesso! Bem-vindo ao FIAT Premium.' : 
                 paymentStatus === 'failure' ? 'Ocorreu um erro no pagamento. Tente novamente.' : 
                 'Seu pagamento está sendo processado.'}
              </p>
              <button onClick={() => setPaymentStatus(null)} className="text-white hover:opacity-70">✕</button>
            </motion.div>
          </div>
        )}
        {currentView === 'home' && (
          <Hero 
            content={heroContent} 
            onPlay={setActiveContent} 
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
        
        <div className={`relative z-20 pb-20 ${currentView === 'home' ? '-mt-16 sm:-mt-32' : 'pt-24'}`}>
          {currentView === 'home' && (
            <>
              {/* Daily Verse Card */}
              {dailyVerse && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-fiat-blue/40 backdrop-blur-xl border border-fiat-gold/30 rounded-2xl p-6 sm:p-10 flex flex-col md:flex-row items-center gap-8 shadow-2xl"
                  >
                    <div className="flex-shrink-0 w-20 h-20 bg-fiat-gold/10 rounded-full flex items-center justify-center border border-fiat-gold/30">
                      <span className="text-fiat-gold font-serif font-bold text-4xl">†</span>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <p className="text-fiat-gold text-xs font-bold uppercase tracking-[0.3em] mb-2">Versículo do Dia</p>
                      <h3 className="text-xl sm:text-2xl font-serif italic mb-2">"{dailyVerse.verse}"</h3>
                      <p className="text-fiat-gold font-bold text-sm mb-4">— {dailyVerse.reference}</p>
                      <p className="text-gray-300 text-sm sm:text-base max-w-2xl">{dailyVerse.reflection}</p>
                    </div>
                  </motion.div>
                </div>
              )}

              {searchQuery && (
                <ContentRow 
                  title={`Resultados para "${searchQuery}"`} 
                  items={filteredContent} 
                  onPlay={setActiveContent} 
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  downloads={downloads}
                />
              )}

              {!searchQuery && history.length > 0 && (
                <ContentRow 
                  title="Continuar Assistindo" 
                  items={history} 
                  onPlay={setActiveContent} 
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  downloads={downloads}
                />
              )}
              
              {!searchQuery && favorites.length > 0 && (
                <ContentRow 
                  title="Minha Lista" 
                  items={favorites} 
                  onPlay={setActiveContent} 
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  downloads={downloads}
                />
              )}

              {categories.map(cat => (
                <ContentRow 
                  key={cat.id} 
                  title={cat.name} 
                  items={filteredContent.filter(c => c.category_id === cat.id)} 
                  onPlay={setActiveContent} 
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  downloads={downloads}
                />
              ))}
            </>
          )}

          {currentView === 'mylist' && (
            <div>
              <ContentRow 
                title="Minha Lista (Histórico)" 
                items={history} 
                onPlay={setActiveContent} 
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                downloads={downloads}
              />
              {history.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-gray-500">Você ainda não assistiu a nenhum conteúdo.</p>
                </div>
              )}
            </div>
          )}

          {currentView === 'favorites' && (
            <div>
              <ContentRow 
                title="Meus Favoritos" 
                items={favorites} 
                onPlay={setActiveContent} 
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                downloads={downloads}
              />
              {favorites.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-gray-500">Sua lista de favoritos está vazia.</p>
                </div>
              )}
            </div>
          )}

          {currentView === 'offline' && (
            <div>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
                <h2 className="text-4xl font-serif font-bold mb-4 gold-text">Conteúdo Offline</h2>
                <p className="text-gray-400">Assista aos seus vídeos baixados mesmo sem internet.</p>
              </div>
              <ContentRow 
                title="Meus Downloads" 
                items={downloads} 
                onPlay={setActiveContent} 
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                downloads={downloads}
              />
              {downloads.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-gray-500">Você ainda não baixou nenhum conteúdo para assistir offline.</p>
                </div>
              )}
            </div>
          )}

          {currentView === 'explore' && (
            <div>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
                <h2 className="text-4xl font-serif font-bold mb-4 gold-text">Explorar</h2>
                <p className="text-gray-400">Descubra novos conteúdos para sua edificação espiritual.</p>
              </div>
              
              {categories.map(cat => (
                <ContentRow 
                  key={cat.id} 
                  title={cat.name} 
                  items={content.filter(c => c.category_id === cat.id)} 
                  onPlay={setActiveContent} 
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  downloads={downloads}
                />
              ))}
            </div>
          )}

          {currentView === 'support' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <h2 className="text-3xl font-serif font-bold mb-8 flex items-center gap-3">
                    <HelpCircle className="w-8 h-8 text-fiat-gold" /> Perguntas Frequentes
                  </h2>
                  <div className="space-y-4">
                    {[
                      { q: 'Como funciona a assinatura?', a: 'Oferecemos planos mensais e anuais com acesso ilimitado a todo o conteúdo.' },
                      { q: 'Posso cancelar a qualquer momento?', a: 'Sim, o cancelamento é simples e pode ser feito diretamente no seu perfil.' },
                      { q: 'Onde posso assistir?', a: 'Em qualquer dispositivo com acesso à internet: celular, tablet ou computador.' }
                    ].map((faq, i) => (
                      <details key={i} className="group bg-fiat-card border border-white/10 rounded-xl overflow-hidden">
                        <summary className="p-4 cursor-pointer font-bold flex items-center justify-between hover:bg-white/5 transition-colors">
                          {faq.q}
                          <span className="text-fiat-gold group-open:rotate-180 transition-transform">&darr;</span>
                        </summary>
                        <div className="p-4 text-gray-400 text-sm border-t border-white/10">
                          {faq.a}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-3xl font-serif font-bold mb-8 flex items-center gap-3">
                    <Phone className="w-8 h-8 text-fiat-gold" /> Suporte & SAC
                  </h2>
                  <div className="bg-fiat-card border border-white/10 rounded-2xl p-8 space-y-6">
                    <p className="text-gray-400">Precisa de ajuda? Nossa equipe está pronta para atender você.</p>
                    <div className="flex flex-col gap-4">
                      <button className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 group">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                          <MessageSquare className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold">WhatsApp Suporte</p>
                          <p className="text-xs text-gray-500">Atendimento imediato</p>
                        </div>
                      </button>
                      <button className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 group">
                        <div className="w-12 h-12 rounded-full bg-fiat-blue/20 flex items-center justify-center text-fiat-blue">
                          <Phone className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold">E-mail SAC</p>
                          <p className="text-xs text-gray-500">contato@fiat.com.br</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer Player / Background Music */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
          onClick={() => setIsMusicPlaying(!isMusicPlaying)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 border-2 ${isMusicPlaying ? 'bg-fiat-gold text-black border-white' : 'bg-fiat-blue text-fiat-gold border-fiat-gold'}`}
        >
          {isMusicPlaying ? <Volume2 className="w-6 h-6 animate-pulse" /> : <VolumeX className="w-6 h-6" />}
          <div className="absolute -top-2 -right-2 bg-fiat-red text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-white">
            MUSIC
          </div>
        </button>
      </div>

      <footer className="bg-fiat-card border-t border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-fiat-blue rounded-full flex items-center justify-center border border-fiat-gold">
              <span className="text-fiat-gold font-serif font-bold text-xl">F</span>
            </div>
            <div>
              <p className="text-xl font-serif font-bold gold-text tracking-tighter">FIAT</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Plataforma Católica Digital</p>
            </div>
          </div>
          
          <div className="flex gap-8 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
            <a href="#" className="hover:text-white transition-colors">Ajuda</a>
          </div>

          <p className="text-xs text-gray-600">&copy; 2024 FIAT. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {activeContent && (
          <Player 
            content={activeContent} 
            onClose={() => { setActiveContent(null); fetchUserData(); }} 
            onProgress={handleUpdateProgress}
          />
        )}
        
        {showAuth && (
          <AuthModal 
            onClose={() => setShowAuth(false)} 
            onLogin={handleLogin} 
            onRegister={handleRegister} 
          />
        )}

        {showAdmin && user?.role === 'admin' && (
          <AdminPanel 
            token={token!} 
            onClose={() => { setShowAdmin(false); fetchContent(); }} 
          />
        )}

        {showPricing && (
          <PricingModal 
            onClose={() => setShowPricing(false)}
            onSelectPlan={(plan) => {
              setShowPricing(false);
              handleSubscribe(plan);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
