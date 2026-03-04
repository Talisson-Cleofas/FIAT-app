import React from 'react';
import { Play, Info, Plus, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { Content } from '../types';

interface HeroProps {
  content: Content | null;
  onPlay: (content: Content) => void;
  favorites?: Content[];
  onToggleFavorite?: (content: Content) => void;
}

export default function Hero({ content, onPlay, favorites = [], onToggleFavorite }: HeroProps) {
  if (!content) return null;

  const isFavorite = content ? favorites.some(f => f.id === content.id) : false;

  return (
    <div className="relative h-[70vh] sm:h-[85vh] w-full overflow-hidden">
      {/* Background Image with Gradient */}
      <div className="absolute inset-0">
        <img 
          src={content.thumbnail} 
          alt={content.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-fiat-bg via-fiat-bg/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-fiat-bg via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-fiat-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Original FIAT</span>
            <span className="text-fiat-gold text-sm font-serif italic">{content.category_name}</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold mb-4 leading-tight">
            {content.title}
          </h1>
          
          <p className="text-gray-300 text-sm sm:text-lg mb-8 line-clamp-3 max-w-xl">
            {content.description}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={() => onPlay(content)}
              className="flex items-center gap-2 bg-white text-black px-6 sm:px-8 py-2.5 sm:py-3 rounded-md font-bold hover:bg-white/90 transition-all transform hover:scale-105"
            >
              <Play className="w-5 h-5 fill-current" /> Assistir Agora
            </button>
            
            <button className="flex items-center gap-2 bg-gray-500/40 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-md font-bold hover:bg-gray-500/60 transition-all backdrop-blur-md">
              <Info className="w-5 h-5" /> Mais Informações
            </button>
            
            <button 
              onClick={() => onToggleFavorite?.(content)}
              className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full border-2 transition-all ${isFavorite ? 'bg-fiat-red border-fiat-red text-white' : 'border-white/30 text-white hover:border-white hover:bg-white/10'}`}
            >
              <Heart className={`w-6 h-6 ${isFavorite ? 'fill-white' : ''}`} />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
