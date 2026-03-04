import React from 'react';
import { motion } from 'motion/react';
import { X, Check, Star } from 'lucide-react';

interface PricingModalProps {
  onClose: () => void;
  onSelectPlan: (plan: 'monthly' | 'yearly') => void;
}

export default function PricingModal({ onClose, onSelectPlan }: PricingModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-4xl bg-fiat-card border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 sm:p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">Escolha seu Plano Premium</h2>
            <p className="text-gray-400 max-w-lg mx-auto">Tenha acesso ilimitado a todo o conteúdo exclusivo da plataforma FIAT e fortaleça sua jornada espiritual.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Monthly Plan */}
            <div className="relative group bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-fiat-gold/50 transition-all flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Plano Mensal</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">R$ 29,90</span>
                  <span className="text-gray-500 text-sm">/mês</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {[
                  'Acesso a todos os vídeos',
                  'Qualidade Full HD',
                  'Sem anúncios',
                  'Cancele quando quiser'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-emerald-500" /> {feature}
                  </li>
                ))}
              </ul>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelectPlan('monthly')}
                className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all border border-white/10"
              >
                Assinar Mensal
              </motion.button>
            </div>

            {/* Yearly Plan */}
            <div className="relative group bg-fiat-blue/20 border-2 border-fiat-gold rounded-2xl p-8 transition-all flex flex-col shadow-[0_0_30px_rgba(212,175,55,0.1)]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-fiat-gold text-black text-[10px] font-black px-4 py-1 rounded-full flex items-center gap-1 uppercase tracking-widest">
                <Star className="w-3 h-3 fill-black" /> Melhor Valor
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2 gold-text">Plano Anual</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">R$ 299,00</span>
                  <span className="text-gray-500 text-sm">/ano</span>
                </div>
                <p className="text-emerald-500 text-xs font-bold mt-1">Economize R$ 59,80 por ano</p>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {[
                  'Tudo do plano mensal',
                  '2 meses grátis',
                  'Acesso prioritário a lançamentos',
                  'Suporte VIP'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-fiat-gold" /> {feature}
                  </li>
                ))}
              </ul>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelectPlan('yearly')}
                className="w-full py-4 bg-fiat-gold text-black rounded-xl font-bold transition-all hover:scale-[1.02] shadow-lg"
              >
                Assinar Anual
              </motion.button>
            </div>
          </div>

          <p className="text-center text-[10px] text-gray-500 mt-12 uppercase tracking-widest">
            Pagamento seguro via Mercado Pago • Criptografia SSL de 256 bits
          </p>
        </div>
      </motion.div>
    </div>
  );
}
