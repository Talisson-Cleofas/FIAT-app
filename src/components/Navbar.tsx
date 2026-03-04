import React, { useState, useEffect } from 'react';
import { Search, User, LogOut, Settings, Bell, Menu, X, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType } from '../types';

interface NavbarProps {
  user: UserType | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onSearch: (query: string) => void;
  currentView: string;
  onViewChange: (view: string) => void;
  onSubscribe: () => void;
}

export default function Navbar({ user, onLogout, onOpenAuth, onOpenAdmin, onSearch, currentView, onViewChange, onSubscribe }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    onSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-fiat-bg shadow-lg' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center gap-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 cursor-pointer group" 
              onClick={() => window.location.href = '/'}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 bg-fiat-blue rounded-full flex items-center justify-center border border-fiat-gold transition-transform group-hover:scale-110">
                <span className="text-fiat-gold font-serif font-bold text-lg sm:text-xl lg:text-2xl">F</span>
              </div>
              <span className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold tracking-tighter gold-text">FIAT</span>
            </motion.div>
            
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
              <motion.button 
                whileTap={{ scale: 0.95 }} 
                onClick={() => onViewChange('home')}
                className={`${currentView === 'home' ? 'text-white font-bold' : 'hover:text-white'} transition-colors`}
              >
                Início
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.95 }} 
                onClick={() => onViewChange('explore')}
                className={`${currentView === 'explore' ? 'text-white font-bold' : 'hover:text-white'} transition-colors`}
              >
                Explorar
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.95 }} 
                onClick={() => onViewChange('mylist')}
                className={`${currentView === 'mylist' ? 'text-white font-bold' : 'hover:text-white'} transition-colors`}
              >
                Minha Lista
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.95 }} 
                onClick={() => onViewChange('favorites')}
                className={`${currentView === 'favorites' ? 'text-white font-bold' : 'hover:text-white'} transition-colors`}
              >
                Favoritos
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.95 }} 
                onClick={() => onViewChange('offline')}
                className={`${currentView === 'offline' ? 'text-white font-bold' : 'hover:text-white'} transition-colors`}
              >
                Offline
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.95 }} 
                onClick={() => onViewChange('support')}
                className={`${currentView === 'support' ? 'text-white font-bold' : 'hover:text-white'} transition-colors`}
              >
                Suporte
              </motion.button>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden sm:flex items-center bg-white/10 rounded-full px-3 py-1 border border-white/10 focus-within:border-fiat-gold/50 transition-all">
              <Search className="w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-xs w-24 lg:w-48 placeholder-gray-500 ml-2"
              />
            </div>

            {user ? (
              <div className="flex items-center gap-4">
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Bell className="w-5 h-5 text-gray-300 cursor-pointer hover:text-white hidden sm:block" />
                </motion.div>
                <div className="relative group">
                  <motion.div whileTap={{ scale: 0.95 }} className="flex items-center gap-2 cursor-pointer">
                    <div className="w-8 h-8 rounded-md bg-fiat-blue border border-fiat-gold/30 flex items-center justify-center">
                      <User className="w-5 h-5 text-fiat-gold" />
                    </div>
                  </motion.div>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-fiat-card border border-white/10 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2">
                    <div className="px-4 py-2 border-bottom border-white/10 mb-2">
                      <p className="text-sm font-semibold truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <motion.button 
                      whileTap={{ scale: 0.98 }}
                      onClick={onSubscribe}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 flex items-center gap-2 text-fiat-gold font-bold"
                    >
                      <CreditCard className="w-4 h-4" /> Seja Premium
                    </motion.button>
                    {user.role === 'admin' && (
                      <motion.button 
                        whileTap={{ scale: 0.98 }}
                        onClick={onOpenAdmin}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" /> Painel Admin
                      </motion.button>
                    )}
                    <motion.button 
                      whileTap={{ scale: 0.98 }}
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-white/5 text-fiat-red flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Sair
                    </motion.button>
                  </div>
                </div>
              </div>
            ) : (
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={onOpenAuth}
                className="bg-fiat-blue hover:bg-blue-800 text-white px-4 py-1.5 rounded-md text-sm font-semibold transition-all border border-fiat-gold/30"
              >
                Entrar
              </motion.button>
            )}
            
            <motion.button 
              whileTap={{ scale: 0.9 }}
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden z-[-1]"
            />
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden bg-fiat-card border-b border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-8 space-y-2">
                {[
                  { name: 'Início', id: 'home' },
                  { name: 'Explorar', id: 'explore' },
                  { name: 'Minha Lista', id: 'mylist' },
                  { name: 'Favoritos', id: 'favorites' },
                  { name: 'Offline', id: 'offline' },
                  { name: 'Suporte', id: 'support' },
                ].map((item, i) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileTap={{ scale: 0.95, x: 5 }}
                    transition={{ delay: i * 0.1 }}
                    className={`block w-full text-left py-3 px-4 text-xl font-medium rounded-xl transition-colors ${currentView === item.id ? 'bg-white/10 text-fiat-gold' : 'hover:bg-white/5'}`}
                    onClick={() => { onViewChange(item.id); setIsMobileMenuOpen(false); }}
                  >
                    {item.name}
                  </motion.button>
                ))}
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="pt-6 mt-4 border-t border-white/10"
                >
                  <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-fiat-gold/50 transition-all">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar conteúdo..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none focus:ring-0 text-base w-full ml-3 placeholder-gray-500"
                    />
                  </div>
                </motion.div>

                {user && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="pt-6 mt-4 border-t border-white/10 space-y-2"
                  >
                    <div className="px-4 py-2 mb-2">
                      <p className="text-sm font-semibold gold-text">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <motion.button 
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { onSubscribe(); setIsMobileMenuOpen(false); }}
                      className="w-full text-left px-4 py-3 text-base font-medium hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors text-fiat-gold font-bold"
                    >
                      <CreditCard className="w-5 h-5" /> Seja Premium
                    </motion.button>
                    {user.role === 'admin' && (
                      <motion.button 
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { onOpenAdmin(); setIsMobileMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 text-base font-medium hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors"
                      >
                        <Settings className="w-5 h-5" /> Painel Admin
                      </motion.button>
                    )}
                    <motion.button 
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                      className="w-full text-left px-4 py-3 text-base font-medium hover:bg-white/5 rounded-xl text-fiat-red flex items-center gap-3 transition-colors"
                    >
                      <LogOut className="w-5 h-5" /> Sair
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
