import React from 'react';
import { Play, Compass, Heart, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Content } from '../types';

interface HeroProps {
  content: Content | null;
  onPlay: (content: Content) => void;
  favorites?: Content[];
  onToggleFavorite?: (content: Content) => void;
  onExplore: () => void;
}

export default function Hero({ content, onPlay, favorites = [], onToggleFavorite, onExplore }: HeroProps) {
  const isFavorite = content ? favorites.some(f => f.id === content.id) : false;
  const title = content?.title || 'Uma jornada diária de fé';
  const description = content?.description || 'Bíblia, Catecismo, Diário da Divina Misericórdia, devocionais, salmos e podcasts em uma única experiência.';

  return (
    <section className="relative h-[78vh] min-h-[580px] sm:h-[88vh] w-full overflow-hidden hero-cinema">
      {/* Background Image with Gradient */}
      <div className="absolute inset-0">
        <img 
          src={content?.thumbnail || '/fiat-hero.jpg'}
          alt={content?.title || 'Bíblia aberta iluminada por uma luz dourada'}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-fiat-bg via-fiat-bg/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-fiat-bg via-fiat-bg/5 to-black/20" />
        <div className="absolute inset-0 hero-vignette" />
      </div>

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <div className="flex items-center gap-2 mb-5">
            <span className="bg-fiat-gold text-black text-[10px] font-extrabold px-2 py-1 rounded-sm uppercase tracking-[0.18em]">FIAT Original</span>
            <span className="text-white/80 text-sm">{content?.category_name || 'Formação católica todos os dias'}</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold mb-4 leading-tight">
            {title}
          </h1>
          
          <p className="text-gray-300 text-sm sm:text-lg mb-8 line-clamp-3 max-w-xl">
            {description}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={() => content ? onPlay(content) : onExplore()}
              className="flex items-center gap-2 bg-white text-black px-6 sm:px-8 py-2.5 sm:py-3 rounded-md font-bold hover:bg-white/90 transition-all transform hover:scale-105"
            >
              {content ? <Play className="w-5 h-5 fill-current" /> : <Compass className="w-5 h-5" />}
              {content ? 'Assistir agora' : 'Explorar catálogo'}
            </button>
            
            <button onClick={onExplore} className="flex items-center gap-2 bg-white/15 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-md font-bold hover:bg-white/25 transition-all backdrop-blur-md border border-white/10">
              <Sparkles className="w-5 h-5" /> Ver jornadas
            </button>
            
            {content && <button
              onClick={() => onToggleFavorite?.(content)}
              className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full border-2 transition-all ${isFavorite ? 'bg-fiat-red border-fiat-red text-white' : 'border-white/30 text-white hover:border-white hover:bg-white/10'}`}
            >
              <Heart className={`w-6 h-6 ${isFavorite ? 'fill-white' : ''}`} />
            </button>}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
