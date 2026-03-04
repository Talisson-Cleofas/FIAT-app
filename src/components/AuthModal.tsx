import React, { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (name: string, email: string, pass: string) => Promise<void>;
}

export default function AuthModal({ onClose, onLogin, onRegister }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await onLogin(email, password);
      } else {
        await onRegister(name, email, password);
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-fiat-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="absolute top-4 right-4">
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-fiat-blue rounded-full flex items-center justify-center border-2 border-fiat-gold mx-auto mb-4">
              <span className="text-fiat-gold font-serif font-bold text-3xl">F</span>
            </div>
            <h2 className="text-3xl font-serif font-bold gold-text">
              {isLogin ? 'Bem-vindo ao FIAT' : 'Crie sua conta'}
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              {isLogin ? 'Acesse os melhores conteúdos católicos' : 'Junte-se à nossa comunidade digital'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:border-fiat-gold focus:ring-1 focus:ring-fiat-gold transition-all outline-none"
                    placeholder="Seu nome"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:border-fiat-gold focus:ring-1 focus:ring-fiat-gold transition-all outline-none"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Senha</label>
                {isLogin && <a href="#" className="text-[10px] text-fiat-gold hover:underline">Esqueceu a senha?</a>}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:border-fiat-gold focus:ring-1 focus:ring-fiat-gold transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <p className="text-fiat-red text-xs text-center font-medium">{error}</p>}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-fiat-blue hover:bg-blue-800 text-white font-bold py-4 rounded-xl transition-all border border-fiat-gold/30 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              {isLogin ? 'Não tem uma conta?' : 'Já possui uma conta?'}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 gold-text font-bold hover:underline"
              >
                {isLogin ? 'Cadastre-se' : 'Faça login'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
