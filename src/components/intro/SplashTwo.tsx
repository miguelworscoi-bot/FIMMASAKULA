import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ArrowRight, ArrowLeft, SkipForward, Play } from 'lucide-react';

interface SplashTwoProps {
  onNext: () => void;
  onSkipToLogin: () => void;
  onPrev: () => void;
}

export const SplashTwo: React.FC<SplashTwoProps> = ({ onNext, onSkipToLogin, onPrev }) => {
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

  const handleEnded = () => {
    onNext();
  };

  const handleManualPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  return (
    <div 
      id="splash-screen-2" 
      onClick={onNext}
      className="relative w-full h-screen bg-zinc-950 text-white flex flex-col justify-between items-center overflow-hidden select-none font-sans cursor-pointer"
    >
      {/* Background Holographic Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/90 pointer-events-none z-10" />

      {/* Header */}
      <header className="relative z-30 w-full p-6 sm:p-8 flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-800/80 text-xs text-emerald-400 backdrop-blur-md">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span className="font-semibold tracking-wide uppercase text-[10px]">Certificação AGT nº 348/AGT/2026</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-xs text-zinc-400 hover:text-white border border-zinc-800 backdrop-blur-md transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Voltar</span>
          </button>

          <button
            id="btn-skip-splash-2"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSkipToLogin();
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-zinc-900/95 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 hover:text-white border border-zinc-700/60 backdrop-blur-md transition-colors cursor-pointer"
          >
            <span>Pular</span>
            <SkipForward size={13} />
          </button>
        </div>
      </header>

      {/* Video Presentation */}
      <main className="relative z-20 w-full max-w-4xl flex-1 flex flex-col items-center justify-center p-4">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onEnded={handleEnded}
          onError={(e) => {
            if (e.currentTarget.src !== window.location.origin + '/masakula-intro.mp4') {
              e.currentTarget.src = '/masakula-intro.mp4';
              e.currentTarget.play().catch(() => {});
            }
          }}
          className="w-full max-h-[68vh] object-contain rounded-2xl shadow-2xl"
        >
          <source src="/Corporate_title_card_animation_f…_202608262347.mp4" type="video/mp4" />
          <source src="/masakula-intro.mp4" type="video/mp4" />
        </video>

        {!isPlaying && (
          <button
            type="button"
            onClick={handleManualPlay}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-emerald-500/90 text-zinc-950 flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform z-30 cursor-pointer"
          >
            <Play className="w-7 h-7 fill-current translate-x-0.5" />
          </button>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-30 w-full max-w-md mx-auto p-6 sm:p-8 space-y-3 flex flex-col items-center">
        <p className="text-xs text-zinc-400 font-medium tracking-wide">
          Toque para pular
        </p>

        <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ ease: "linear" }}
          />
        </div>
      </footer>
    </div>
  );
};
