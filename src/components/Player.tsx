import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw, Settings, Maximize, Plus, Download, CheckCircle2, Loader2, Trash2, Minimize } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Content } from '../types';
import { offlineService } from '../services/offlineService';

interface PlayerProps {
  content: Content;
  onClose: () => void;
  onProgress: (progress: number) => void;
}

export default function Player({ content, onClose, onProgress }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'completed'>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Use a sample video if no URL is provided for online content
  const onlineVideoUrl = content.video_url || 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  useEffect(() => {
    checkIfDownloaded();
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [content.id]);

  const checkIfDownloaded = async () => {
    const offlineItem = await offlineService.getContent(content.id);
    if (offlineItem && offlineItem.blob) {
      setDownloadStatus('completed');
      setVideoUrl(URL.createObjectURL(offlineItem.blob));
    } else {
      setDownloadStatus('idle');
      setVideoUrl(null);
    }
  };

  const handleDownload = async () => {
    if (downloadStatus !== 'idle') return;
    
    setDownloadStatus('downloading');
    setDownloadProgress(0);

    try {
      const url = onlineVideoUrl;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Download failed');

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Could not get reader');

      const chunks: Uint8Array[] = [];
      
      while(true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        loaded += value.length;
        
        if (total) {
          setDownloadProgress(Math.round((loaded / total) * 100));
        }
      }

      const blob = new Blob(chunks);
      await offlineService.saveContent(content, blob);
      setDownloadStatus('completed');
      setVideoUrl(URL.createObjectURL(blob));
    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus('idle');
      alert('Erro ao baixar vídeo. Tente novamente.');
    }
  };

  const handleDeleteDownload = async () => {
    if (confirm('Deseja remover este vídeo dos seus downloads offline?')) {
      await offlineService.deleteContent(content.id);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
      setDownloadStatus('idle');
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleProgress = () => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      const duration = videoRef.current.duration;
      if (duration > 0) {
        setBuffered((bufferedEnd / duration) * 100);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout((window as any).controlsTimeout);
      (window as any).controlsTimeout = setTimeout(() => setShowControls(false), 3000);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input (though there aren't many here)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'arrowleft':
          e.preventDefault();
          skip(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          skip(10);
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume(prev => {
            const next = Math.min(1, prev + 0.1);
            if (videoRef.current) videoRef.current.volume = next;
            return next;
          });
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume(prev => {
            const next = Math.max(0, prev - 0.1);
            if (videoRef.current) videoRef.current.volume = next;
            return next;
          });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, volume, isFullscreen]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-fiat-bg overflow-y-auto scrollbar-hide"
    >
      {/* Video Section */}
      <div 
        ref={containerRef}
        className="relative w-full aspect-video bg-black flex items-center justify-center group overflow-hidden"
      >
        <video 
          ref={videoRef}
          src={videoUrl || onlineVideoUrl}
          className="w-full h-full object-contain cursor-pointer"
          autoPlay={isPlaying}
          muted={isMuted}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime);
              const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
              onProgress(p);
            }
          }}
          onProgress={handleProgress}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onCanPlay={() => setIsBuffering(false)}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={togglePlay}
        />

        {/* Buffering Spinner */}
        <AnimatePresence>
          {isBuffering && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none"
            >
              <Loader2 className="w-12 h-12 text-fiat-gold animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Close Button - Always visible or on hover */}
        {!isFullscreen && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 rounded-full transition-colors text-white"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        {/* Controls Overlay */}
        <AnimatePresence>
          {showControls && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 flex flex-col justify-between p-4 sm:p-6"
            >
              {/* Top Bar */}
              <div className="flex items-center justify-between">
                <h3 className="text-white font-serif font-bold truncate max-w-[70%]">{content.title}</h3>
              </div>

              {/* Bottom Controls */}
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] sm:text-xs font-mono text-white min-w-[40px]">{formatTime(currentTime)}</span>
                  <div className="relative flex-1 h-1.5 bg-white/20 rounded-full cursor-pointer group">
                    {/* Buffer Bar */}
                    <div 
                      className="absolute h-full bg-white/30 rounded-full transition-all duration-300"
                      style={{ width: `${buffered}%` }}
                    />
                    {/* Current Progress Bar */}
                    <div 
                      className="absolute h-full bg-fiat-red rounded-full flex items-center justify-end"
                      style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                    >
                      <div className="w-3 h-3 bg-fiat-red rounded-full scale-0 group-hover:scale-100 transition-transform shadow-lg" />
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max={duration || 0}
                      step="0.1"
                      value={currentTime}
                      onChange={handleSeek}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs font-mono text-white min-w-[40px]">{formatTime(duration)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <button onClick={togglePlay} className="text-white hover:text-fiat-gold transition-colors">
                      {isPlaying ? <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" /> : <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />}
                    </button>
                    
                    <div className="flex items-center gap-3 sm:gap-4">
                      <button onClick={() => skip(-10)} className="text-white hover:text-fiat-gold transition-colors">
                        <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                      <button onClick={() => skip(10)} className="text-white hover:text-fiat-gold transition-colors">
                        <RotateCw className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 group relative">
                      <button onClick={toggleMute} className="text-white hover:text-fiat-gold transition-colors">
                        {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" /> : <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />}
                      </button>
                      <div className="w-0 group-hover:w-20 overflow-hidden transition-all duration-300 flex items-center">
                        <input 
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-fiat-gold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button className="text-white hover:text-fiat-gold transition-colors">
                      <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    <button onClick={toggleFullscreen} className="text-white hover:text-fiat-gold transition-colors">
                      {isFullscreen ? <Minimize className="w-5 h-5 sm:w-6 sm:h-6" /> : <Maximize className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info Section Below Video */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-fiat-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Original FIAT</span>
              <p className="text-fiat-gold text-sm font-serif italic">{content.category_name}</p>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mb-4">{content.title}</h2>
            
            <div className="flex items-center gap-4 mb-8 text-gray-400 text-sm">
              <span className="flex items-center gap-1">
                <Maximize className="w-4 h-4" /> {content.views?.toLocaleString()} visualizações
              </span>
              <span>•</span>
              <span>{new Date(content.published_at).toLocaleDateString('pt-BR')}</span>
            </div>

            <div className="bg-fiat-card border border-white/10 rounded-2xl p-6 sm:p-8 mb-8">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-fiat-gold" /> Descrição do Conteúdo
              </h3>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
                {content.description}
              </p>
            </div>

            {content.tags && (
              <div className="flex flex-wrap gap-2">
                {content.tags.split(',').map((tag, i) => (
                  <span 
                    key={i} 
                    className="px-4 py-1.5 bg-fiat-blue/30 rounded-full text-xs font-bold uppercase tracking-widest text-fiat-gold border border-fiat-gold/20 hover:bg-fiat-blue/50 transition-colors cursor-pointer"
                  >
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Actions */}
          <div className="w-full md:w-72 space-y-4">
            <button 
              onClick={handleDownload}
              disabled={downloadStatus !== 'idle'}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                downloadStatus === 'completed' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50' :
                downloadStatus === 'downloading' ? 'bg-fiat-blue/20 text-fiat-gold border border-fiat-gold/30' :
                'bg-white text-black hover:bg-white/90'
              }`}
            >
              {downloadStatus === 'idle' && (
                <>
                  <Download className="w-5 h-5" /> Baixar para Offline
                </>
              )}
              {downloadStatus === 'downloading' && (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Baixando {downloadProgress}%
                </>
              )}
              {downloadStatus === 'completed' && (
                <>
                  <CheckCircle2 className="w-5 h-5" /> Disponível Offline
                </>
              )}
            </button>
            {downloadStatus === 'completed' && (
              <button 
                onClick={handleDeleteDownload}
                className="w-full bg-fiat-red/10 text-fiat-red border border-fiat-red/30 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-fiat-red/20 transition-all"
              >
                <Trash2 className="w-5 h-5" /> Remover Download
              </button>
            )}
            <button className="w-full bg-fiat-card border border-white/10 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-all">
              <Plus className="w-5 h-5" /> Adicionar à Minha Lista
            </button>
            <div className="p-6 bg-fiat-blue/10 border border-fiat-gold/20 rounded-2xl">
              <p className="text-xs text-fiat-gold font-bold uppercase tracking-widest mb-2">Sugestão FIAT</p>
              <p className="text-sm text-gray-400 italic">"Tudo posso naquele que me fortalece." — Filipenses 4:13</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
