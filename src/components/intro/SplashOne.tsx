import React, { useRef, useEffect } from 'react';
import { SkipForward } from 'lucide-react';

interface SplashOneProps {
  onNext: () => void;
  onSkipToLogin?: () => void;
}

export const SplashOne: React.FC<SplashOneProps> = ({ onNext, onSkipToLogin }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.playsInline = true;
      video.play().catch(() => {});
    }
  }, []);

  const handleEnded = () => {
    onNext();
  };

  return (
    <div
      id="splash-screen-1"
      onClick={onNext}
      className="relative h-screen w-full overflow-hidden bg-black cursor-pointer"
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        className="h-full w-full object-cover"
      >
        <source src="/masakula-intro.mp4" type="video/mp4" />
      </video>

      {onSkipToLogin && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSkipToLogin();
          }}
          className="absolute right-5 top-5 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/30 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white backdrop-blur-sm transition-opacity hover:bg-black/40"
        >
          <span>Pular</span>
          <SkipForward size={12} />
        </button>
      )}
    </div>
  );
};
