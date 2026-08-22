import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Plus, Heart, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { Content } from '../types';

interface ContentRowProps {
  title: string;
  items: Content[];
  onPlay: (content: Content) => void;
  favorites?: Content[];
  onToggleFavorite?: (content: Content) => void;
  downloads?: Content[];
  emptyDescription?: string;
}

const ContentRow: React.FC<ContentRowProps> = ({ title, items, onPlay, favorites = [], onToggleFavorite, downloads = [], emptyDescription }) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const isFavorite = (id: string) => favorites.some(f => f.id === id);
  const isDownloaded = (id: string) => downloads.some(d => d.id === id);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (items.length === 0 && !emptyDescription) return null;

  return (
    <div className="mb-8 sm:mb-12 group/row">
      <h2 className="text-lg sm:text-xl font-bold mb-3 px-4 sm:px-8 lg:px-12 flex items-center gap-2 tracking-tight">
        {title}
        <span className="text-fiat-gold text-xs font-sans font-normal opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer">Ver tudo &rsaquo;</span>
      </h2>
      
      <div className="relative group">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center hover:bg-black/70"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <div 
          ref={rowRef}
          className="flex gap-2 sm:gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-8 lg:px-12 pb-4 snap-x"
        >
          {items.length === 0 ? (
            <div className="catalog-placeholder flex-shrink-0 w-[82vw] sm:w-[520px] min-h-40 rounded-xl p-6 sm:p-8 flex flex-col justify-end snap-start">
              <span className="text-fiat-gold text-[10px] font-bold uppercase tracking-[0.22em]">Em preparação</span>
              <h3 className="text-xl sm:text-2xl font-bold mt-2">{title}</h3>
              <p className="text-sm text-white/65 max-w-md mt-1">{emptyDescription}</p>
            </div>
          ) : items.map((item) => (
            <motion.div 
              key={item.id}
              whileHover={{ scale: 1.08, y: -8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="stream-card flex-shrink-0 w-44 sm:w-64 lg:w-72 aspect-video relative rounded-md overflow-hidden cursor-pointer group/card snap-start bg-fiat-card border border-white/5"
              onClick={() => onPlay(item)}
            >
              <img 
                src={item.thumbnail} 
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                referrerPolicy="no-referrer"
              />

              {isDownloaded(item.id) && (
                <div className="absolute top-2 left-2 z-10 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 shadow-lg">
                  <Download className="w-2.5 h-2.5" /> Offline
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black">
                    <Play className="w-4 h-4 fill-current" />
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/50 flex items-center justify-center hover:border-white transition-colors">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div 
                    className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ml-auto ${isFavorite(item.id) ? 'bg-fiat-red border-fiat-red' : 'border-white/50 hover:border-white'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite?.(item);
                    }}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite(item.id) ? 'fill-white text-white' : ''}`} />
                  </div>
                </div>
                <h3 className="font-bold text-sm sm:text-base line-clamp-1">{item.title}</h3>
                <p className="text-[10px] text-gray-300 line-clamp-2 mt-1 leading-tight">{item.description}</p>
                <p className="text-[10px] text-fiat-gold uppercase tracking-wider mt-2 font-semibold">{item.category_name}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center hover:bg-black/70"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
};

export default ContentRow;
