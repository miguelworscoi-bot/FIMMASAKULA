import React, { useRef } from 'react';

interface IntroVideoProps {
  onFinish: () => void;
}

/**
 * Reproduz o vídeo de introdução original (sem alterações).
 * Quando o vídeo termina naturalmente, chama onFinish para entrar na tela de login.
 */
export function IntroVideo({ onFinish }: IntroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div
      id="intro-video-stage"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
    >
      <video
        ref={videoRef}
        src="/intro/vendas-intro.mp4"
        autoPlay
        muted
        playsInline
        onEnded={onFinish}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
