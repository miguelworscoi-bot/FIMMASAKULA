import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Play, SkipForward } from 'lucide-react';

interface SplashOneProps {
  onNext: () => void;
  onSkipToLogin?: () => void;
}

export const SplashOne: React.FC<SplashOneProps> = ({ onNext, onSkipToLogin }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const DURATION_MS = 3800; // 3.8s

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.playsInline = true;
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / DURATION_MS) * 100, 100);
      setProgress(pct);

      if (elapsed >= DURATION_MS) {
        clearInterval(interval);
        onNext();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [onNext]);

  const handleManualPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleEnded = () => {
    onNext();
  };

  return (
    <div
      id="splash-screen-1"
      onClick={onNext}
      className="relative w-full h-screen bg-white text-zinc-950 flex flex-col justify-between items-center select-none overflow-hidden cursor-pointer"
      style={{ fontFamily: "'Josefin Sans', sans-serif" }}
    >
      {/* Botão de Pular no topo */}
      <header className="w-full relative z-30 p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xl tracking-tight text-zinc-900">Masakula</span>
          <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
            Fase 1/2
          </span>
        </div>

        {onSkipToLogin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSkipToLogin();
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-zinc-600 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200/80 transition-colors z-30 cursor-pointer shadow-xs"
          >
            <span>Pular</span>
            <SkipForward size={13} />
          </button>
        )}
      </header>

      {/* Reprodutor de Vídeo Nativo */}
      <main className="relative w-full max-w-4xl h-full flex-1 flex items-center justify-center p-4">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onEnded={handleEnded}
          onError={(e) => {
            // Fallback gracefully if primary video path is loading
            if (e.currentTarget.src !== window.location.origin + '/masakula-intro.mp4') {
              e.currentTarget.src = '/masakula-intro.mp4';
              e.currentTarget.play().catch(() => {});
            }
          }}
          className="w-full max-h-[75vh] object-contain rounded-2xl"
        >
          <source src="/Vendas (2).mp4" type="video/mp4" />
          <source src="/masakula-intro.mp4" type="video/mp4" />
        </video>

        {/* Botão Play caso o browser tenha bloqueado autoplay */}
        {!isPlaying && (
          <button
            type="button"
            onClick={handleManualPlay}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/80 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform z-20 cursor-pointer"
          >
            <Play className="w-7 h-7 fill-current translate-x-0.5" />
          </button>
        )}
      </main>

      {/* Rodapé com aviso e barra de progresso */}
      <footer className="w-full relative z-30 p-6 flex flex-col items-center gap-2.5">
        <p className="text-xs text-zinc-400 font-medium tracking-wide">
          Toque para pular
        </p>

        <div className="w-36 h-1 bg-zinc-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-zinc-900 rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ ease: 'linear' }}
          />
        </div>
      </footer>
    </div>
  );
};
