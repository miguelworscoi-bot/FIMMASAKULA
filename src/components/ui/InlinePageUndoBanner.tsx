"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, X, AlertCircle } from 'lucide-react';
import { useTrash } from '@/contexts/TrashContext';

interface InlinePageUndoBannerProps {
  pageType?: 'product' | 'category' | 'customer' | 'expense' | 'user' | string;
  className?: string;
}

export const InlinePageUndoBanner: React.FC<InlinePageUndoBannerProps> = ({
  pageType,
  className = '',
}) => {
  const { activeUndo, restore, dismissUndo } = useTrash();
  const [progress, setProgress] = useState(100);

  const shouldShow = Boolean(
    activeUndo && (!pageType || activeUndo.type === pageType)
  );

  useEffect(() => {
    if (!shouldShow || !activeUndo) {
      setProgress(100);
      return;
    }

    const duration = 8000;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPercent = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remainingPercent);
      if (remainingPercent <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [shouldShow, activeUndo]);

  if (!shouldShow || !activeUndo) return null;

  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className={`relative overflow-hidden rounded-2xl bg-zinc-950/90 border border-amber-500/30 text-white shadow-xl backdrop-blur-md p-3.5 mb-4 ${className}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Informação do Item Apagado */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="text-xs min-w-0">
              <span className="text-zinc-400">{activeUndo.typeLabel || 'Item'}</span>{' '}
              <span className="font-bold text-white truncate inline-block max-w-[220px] sm:max-w-xs align-bottom">
                "{activeUndo.name}"
              </span>{' '}
              <span className="text-amber-300 font-medium">foi movido para a lixeira.</span>
            </div>
          </div>

          {/* Ações de Desfazer e Fechar */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => restore(activeUndo.id)}
              className="flex items-center gap-1.5 rounded-xl bg-[#E1FB15] hover:bg-[#c9e20f] active:scale-95 text-black px-3.5 py-1.5 text-xs font-black tracking-wide shadow-md transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Desfazer</span>
            </button>

            <button
              type="button"
              onClick={dismissUndo}
              className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Dispensar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de Progresso Regressiva */}
        <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-zinc-800/80">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 to-[#E1FB15]"
            style={{ width: `${progress}%` }}
            transition={{ ease: 'linear' }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
