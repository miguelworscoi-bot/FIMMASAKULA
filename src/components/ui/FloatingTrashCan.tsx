"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trash2, 
  RotateCcw, 
  X, 
  Package, 
  Layers, 
  Users, 
  TrendingDown, 
  UserCheck, 
  Sparkles,
  ArchiveRestore,
  Trash
} from 'lucide-react';
import { useTrash, DeletedItemRecord } from '@/contexts/TrashContext';

export const FloatingTrashCan: React.FC = () => {
  const { 
    deletedItems, 
    isTrashOpen, 
    setIsTrashOpen, 
    isAbsorbing, 
    flyingParticles, 
    restore, 
    removePermanent, 
    clearTrash 
  } = useTrash();

  const [isHovered, setIsHovered] = useState(false);

  // O ícone SÓ APARECE se houver elementos apagados na lixeira
  const hasItems = deletedItems.length > 0;

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'product':
        return <Package className="w-4 h-4 text-emerald-400" />;
      case 'category':
        return <Layers className="w-4 h-4 text-blue-400" />;
      case 'customer':
        return <Users className="w-4 h-4 text-amber-400" />;
      case 'expense':
        return <TrendingDown className="w-4 h-4 text-rose-400" />;
      case 'user':
        return <UserCheck className="w-4 h-4 text-purple-400" />;
      default:
        return <Trash2 className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <>
      {/* 1. OVERLAY DE PARTÍCULAS EM VOO: O elemento apagado viaja e entra dentro do ícone da lixeira */}
      <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
        {flyingParticles.map((particle) => {
          // Destino: canto inferior direito onde está o ícone da lixeira (aprox window.innerWidth - 60, window.innerHeight - 60)
          const targetX = typeof window !== 'undefined' ? window.innerWidth - 60 : 1000;
          const targetY = typeof window !== 'undefined' ? window.innerHeight - 60 : 700;

          return (
            <motion.div
              key={particle.id}
              initial={{
                x: particle.startX,
                y: particle.startY,
                scale: 1,
                opacity: 1,
                rotate: 0,
              }}
              animate={{
                x: [particle.startX, particle.startX + (targetX - particle.startX) * 0.4, targetX],
                y: [particle.startY, Math.min(particle.startY, targetY) - 80, targetY],
                scale: [1, 0.85, 0.15],
                opacity: [1, 0.95, 0],
                rotate: [0, -18, 45],
              }}
              transition={{
                duration: 0.75,
                ease: [0.25, 1, 0.5, 1],
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-950 px-4 py-2.5 text-white shadow-2xl border border-rose-400/40 flex items-center gap-2 backdrop-blur-md"
            >
              <Trash2 className="w-4 h-4 text-rose-300 animate-spin" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200">
                  A mover para a Lixeira
                </span>
                <span className="text-xs font-semibold truncate max-w-[140px] text-white">
                  {particle.name}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 2. ÍCONE FLUTUANTE DA LIXEIRA: SÓ APARECE QUANDO HÁ ELEMENTOS APAGADOS */}
      <AnimatePresence>
        {hasItems && (
          <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Popover / Painel da Lixeira com Lista de Itens */}
            <AnimatePresence>
              {isTrashOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 20, transformOrigin: 'bottom right' }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="mb-3 w-80 sm:w-96 rounded-3xl bg-zinc-950/95 border border-white/10 p-5 text-white shadow-2xl backdrop-blur-xl space-y-4"
                >
                  {/* Header da Lixeira */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        <Trash2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white tracking-wide">
                          Lixeira do Sistema
                        </h4>
                        <p className="text-[11px] text-zinc-400">
                          {deletedItems.length} {deletedItems.length === 1 ? 'item disponível' : 'itens disponíveis'} para restauro
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsTrashOpen(false)}
                      className="rounded-lg p-1 text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                      title="Fechar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Lista de Itens Apagados */}
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {deletedItems.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -15 }}
                        className="group flex items-center justify-between gap-3 rounded-2xl bg-zinc-900/80 border border-white/5 p-3 hover:border-white/15 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5">
                            {getItemIcon(item.type)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate group-hover:text-emerald-300 transition">
                              {item.name}
                            </p>
                            <span className="text-[10px] text-zinc-400 font-medium">
                              {item.typeLabel}
                            </span>
                          </div>
                        </div>

                        {/* Botões de Ação por Item */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => restore(item.id)}
                            className="flex items-center gap-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 text-[11px] font-bold transition active:scale-95 cursor-pointer"
                            title="Restaurar item para o local original"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restaurar</span>
                          </button>
                          <button
                            onClick={() => removePermanent(item.id)}
                            className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                            title="Eliminar definitivamente"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Ações Globais da Lixeira */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-2">
                    <button
                      onClick={clearTrash}
                      className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-lg hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Esvaziar Lixeira</span>
                    </button>

                    <button
                      onClick={async () => {
                        const items = [...deletedItems];
                        for (const it of items) {
                          await restore(it.id);
                        }
                      }}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1.5 cursor-pointer px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5" />
                      <span>Restaurar Todos</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* BOTÃO FLUTUANTE DA LIXEIRA */}
            <motion.button
              layout
              initial={{ scale: 0, rotate: -20, opacity: 0 }}
              animate={{ 
                scale: isAbsorbing ? 1.25 : 1, 
                rotate: isAbsorbing ? [-10, 10, -5, 0] : 0, 
                opacity: 1 
              }}
              exit={{ scale: 0, rotate: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 300 }}
              onClick={() => setIsTrashOpen(!isTrashOpen)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={`relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-2xl transition-all cursor-pointer ${
                isAbsorbing
                  ? 'bg-rose-600 text-white ring-8 ring-rose-500/40 shadow-rose-600/50'
                  : 'bg-zinc-900/95 hover:bg-zinc-800 text-rose-400 border border-rose-500/30 shadow-black/80'
              }`}
              title="Lixeira com itens apagados recentes (clique para abrir)"
            >
              {/* Tampa e balde animados quando absorve item */}
              <div className="relative">
                <Trash2
                  className={`w-6 h-6 transition-transform duration-300 ${
                    isAbsorbing ? 'scale-110 text-white' : ''
                  }`}
                />

                {/* Efeito de brilho de sucção */}
                {isAbsorbing && (
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 -m-2 rounded-full bg-rose-400/50"
                  />
                )}
              </div>

              {/* Badge com Contador de Itens na Lixeira */}
              <motion.span
                key={deletedItems.length}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-black text-white shadow-lg shadow-rose-500/50 border-2 border-zinc-950"
              >
                {deletedItems.length}
              </motion.span>

              {/* Tooltip ao passar o cursor quando fechada */}
              {isHovered && !isTrashOpen && (
                <div className="absolute right-full mr-3 whitespace-nowrap rounded-xl bg-zinc-900 border border-white/10 px-3 py-1.5 text-xs font-semibold text-white shadow-xl">
                  {deletedItems.length} {deletedItems.length === 1 ? 'item na lixeira' : 'itens na lixeira'} • Clique para restaurar
                </div>
              )}
            </motion.button>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
