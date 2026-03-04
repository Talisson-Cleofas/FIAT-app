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
}

const ContentRow: React.FC<ContentRowProps> = ({ title, items, onPlay, favorites = [], onToggleFavorite, downloads = [] }) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const isFavorite = (id: number) => favorites.some(f => f.id === id);
  const isDownloaded = (id: number) => downloads.some(d => d.id === id);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="mb-8 sm:mb-12 group/row">
      <h2 className="text-xl sm:text-2xl font-serif font-bold mb-4 px-4 sm:px-8 lg:px-12 flex items-center gap-2">
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
          {items.map((item) => (
            <motion.div 
              key={item.id}
              whileHover={{ scale: 1.05 }}
              className="flex-shrink-0 w-40 sm:w-64 lg:w-72 aspect-video relative rounded-lg overflow-hidden cursor-pointer group/card snap-start bg-fiat-card border border-white/5"
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
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity flex flex-col justify-end p-4">
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
