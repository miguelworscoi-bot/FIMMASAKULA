"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, RotateCcw, Package, Layers, ShoppingBag, AlertTriangle, CheckCircle2 } from "lucide-react";

export interface TrashItem {
  id: string;
  name: string;
  type: string;
  size?: string;
  date?: string;
  category?: string;
}

export interface AnimatedTrashManagerProps {
  initialItems?: TrashItem[];
  onPermanentDelete?: (item: TrashItem) => void;
  onRestore?: (item: TrashItem) => void;
  onClose?: () => void;
}

const DEFAULT_ITEMS: TrashItem[] = [
  { id: "1", name: "Relatorio-fecho-turno-z.pdf", type: "PDF", size: "1.2 MB", date: "Hoje, 14:30" },
  { id: "2", name: "Foto-artigo-gasosa-sumol.jpg", type: "Imagem", size: "3.4 MB", date: "Ontem" },
  { id: "3", name: "Backup-vendas-offline.zip", type: "Arquivo", size: "12.5 MB", date: "28 Fev" },
  { id: "4", name: "Recibo-anulado-10492.txt", type: "Documento", size: "15 KB", date: "27 Fev" },
];

export function AnimatedTrashManager({
  initialItems = DEFAULT_ITEMS,
  onPermanentDelete,
  onRestore,
  onClose,
}: AnimatedTrashManagerProps) {
  const [items, setItems] = useState<TrashItem[]>(initialItems);
  const [pendingItem, setPendingItem] = useState<TrashItem | null>(null);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const DELETE_TIMEOUT = 5000; // 5 segundos para desfazer

  const startPendingDelete = (item: TrashItem) => {
    // Se já havia item pendente, consuma-o imediatamente
    if (pendingItem) {
      finalizeDelete(pendingItem);
    }

    setPendingItem(item);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setProgress(100);

    const startTime = Date.now();
    
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / DELETE_TIMEOUT) * 100);
      setProgress(remaining);
      if (remaining <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, 50);

    timerRef.current = setTimeout(() => {
      finalizeDelete(item);
    }, DELETE_TIMEOUT);
  };

  const finalizeDelete = (item: TrashItem) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    onPermanentDelete?.(item);
    setPendingItem(null);
  };

  const undoDelete = () => {
    if (!pendingItem) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    setItems((prev) => [pendingItem, ...prev]);
    onRestore?.(pendingItem);
    setPendingItem(null);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
      case "documento":
        return <Layers className="w-4 h-4 text-emerald-400" />;
      case "imagem":
        return <Package className="w-4 h-4 text-cyan-400" />;
      default:
        return <ShoppingBag className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl bg-[#111111] border border-white/10 p-6 text-white shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Reciclagem & Arquivo</h3>
            <p className="text-xs text-gray-400">Eliminação com salvaguarda de recuperação imediata (5s)</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition"
          >
            Fechar
          </button>
        )}
      </div>

      {/* Undo Banner flutuante / integrado com Barra de Progresso */}
      <AnimatePresence>
        {pendingItem && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-rose-950/30 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-white">Item a ser eliminado: </span>
                  <span className="text-rose-300 font-mono">"{pendingItem.name}"</span>
                </div>
              </div>

              <button
                onClick={undoDelete}
                className="flex items-center gap-1.5 rounded-xl bg-[#E1FB15] px-3.5 py-1.5 text-xs font-bold text-black transition hover:bg-[#c9e20f] active:scale-95 shadow-md"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Desfazer
              </button>
            </div>

            {/* Linha de progresso regressivo */}
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-rose-900/50">
              <motion.div
                className="h-full bg-gradient-to-r from-rose-500 to-amber-400"
                style={{ width: `${progress}%` }}
                transition={{ ease: "linear" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de itens na lixeira */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400/50" />
            <p className="text-sm font-medium text-gray-400">Nenhum elemento na lixeira</p>
            <p className="text-xs text-gray-600">Todos os registos e ficheiros estão em ordem.</p>
          </div>
        ) : (
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="group flex items-center justify-between rounded-2xl border border-white/5 bg-[#171717] p-3.5 transition hover:border-white/20 hover:bg-[#1f1f1f]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-white group-hover:text-[#32D583] transition">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <span>{item.type}</span>
                      {item.size && <span>• {item.size}</span>}
                      {item.date && <span>• {item.date}</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => startPendingDelete(item)}
                  title="Eliminar permanentemente"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-rose-500/10 hover:text-rose-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default AnimatedTrashManager;
