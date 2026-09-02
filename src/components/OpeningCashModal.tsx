"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wallet, ArrowRight, Banknote, ShieldAlert, Loader2 } from "lucide-react";

export interface OpeningCashModalProps {
  isOpen: boolean;
  operatorName: string;
  onOpenSession: (amount: number) => Promise<void>;
  onClose?: () => void;
}

export function OpeningCashModal({
  isOpen,
  operatorName,
  onOpenSession,
  onClose,
}: OpeningCashModalProps) {
  const [amount, setAmount] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Formatação rápida para atalhos de notas
  const handleAddQuickAmount = (val: number) => {
    const current = parseFloat(amount || "0");
    setAmount((current + val).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount < 0) {
      setError("Por favor, introduza um valor inicial válido.");
      return;
    }

    try {
      setLoading(true);
      await onOpenSession(numericAmount);
    } catch (err: any) {
      console.error("Erro ao abrir caixa:", err);
      setError(err?.message || "Falha ao registrar abertura de caixa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
        
        {/* Glow de Fundo */}
        <div className="absolute w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-7 shadow-2xl relative z-10 overflow-hidden"
        >
          {/* Cabeçalho */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">Abertura de Caixa</h2>
            <p className="text-xs text-neutral-400 mt-1">
              Operador: <span className="font-bold text-indigo-400">{operatorName}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo de Saldo Inicial */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block text-left">
                Fundo de Maneio (Saldo Inicial)
              </label>
              
              <div className="relative flex items-center">
                <span className="absolute left-4 font-mono font-bold text-lg text-neutral-400">
                  Kz
                </span>
                <input
                  type="number"
                  step="100"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  disabled={loading}
                  autoFocus
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 rounded-2xl py-3.5 pl-12 pr-4 text-2xl font-mono font-black text-white outline-none transition shadow-inner"
                />
              </div>
            </div>

            {/* Atalhos Rápidos de Notas em Kwanzas (AOA) */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-neutral-500 text-left block">
                Adicionar valores rápidos:
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[1000, 2000, 5000, 10000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAddQuickAmount(val)}
                    disabled={loading}
                    className="py-2 px-1 bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/60 rounded-xl text-xs font-bold text-neutral-300 hover:text-white transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <Banknote className="w-3.5 h-3.5 text-indigo-400" />
                    +{val >= 1000 ? `${val / 1000}k` : val}
                  </button>
                ))}
              </div>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-400"
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Botão de Submissão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>A Registar Turno...</span>
                </>
              ) : (
                <>
                  <span>Confirmar & Abrir Turno</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Rodapé Informativo */}
          <div className="flex items-center justify-between mt-5">
            <p className="text-[11px] text-neutral-500 text-center flex-1">
              O valor registado ficará associado ao seu turno para apuramento de fecho.
            </p>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-neutral-400 hover:text-white underline ml-2 cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default OpeningCashModal;
