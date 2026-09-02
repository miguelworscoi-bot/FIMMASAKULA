"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Banknote, Printer, AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";

export interface ClosingResult {
  session_id: string;
  opening_amount: number;
  cash_sales: number;
  expected_cash: number;
  declared_cash: number;
  difference: number;
}

export interface ClosingCashModalProps {
  isOpen: boolean;
  operatorName: string;
  sessionId: string;
  onCloseSession: (declaredCash: number, notes?: string) => Promise<ClosingResult>;
  onDismiss: () => void;
  onFinish: () => void;
}

export function ClosingCashModal({
  isOpen,
  operatorName,
  sessionId,
  onCloseSession,
  onDismiss,
  onFinish,
}: ClosingCashModalProps) {
  const [declaredCash, setDeclaredCash] = useState<string>("0");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClosingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericAmount = parseFloat(declaredCash);
    if (isNaN(numericAmount) || numericAmount < 0) {
      setError("Por favor, introduza um montante em dinheiro válido.");
      return;
    }

    try {
      setLoading(true);
      const res = await onCloseSession(numericAmount, notes);
      setResult(res);
    } catch (err: any) {
      console.error("Erro ao fechar caixa:", err);
      setError(err?.message || "Erro ao encerrar sessão de caixa.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
        
        {/* Glow de Fundo */}
        <div className="absolute w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-7 shadow-2xl relative z-10 overflow-hidden"
        >
          {/* BOTÃO DE FECHAR (Apenas se ainda não encerrou) */}
          {!result && (
            <button
              onClick={onDismiss}
              className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-white bg-neutral-800/50 rounded-xl transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* CABEÇALHO */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg border transition ${
              result 
                ? result.difference === 0 
                  ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                  : "bg-amber-500/20 border-amber-500/30 text-amber-400"
                : "bg-gradient-to-tr from-purple-600 to-indigo-600 border-indigo-400/30 text-white"
            }`}>
              {result ? <CheckCircle2 className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              {result ? "Turno Encerrado" : "Fecho de Turno & Caixa"}
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Operador: <span className="font-bold text-indigo-400">{operatorName}</span> | Sessão: <span className="font-mono text-neutral-300">#{sessionId.slice(0, 8)}</span>
            </p>
          </div>

          {/* ESTADO 1: FORMULÁRIO DE CONTAGEM CEGA */}
          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block text-left">
                  Contagem Física (Total em Dinheiro na Gaveta)
                </label>
                
                <div className="relative flex items-center">
                  <span className="absolute left-4 font-mono font-bold text-lg text-neutral-400">
                    Kz
                  </span>
                  <input
                    type="number"
                    step="50"
                    min="0"
                    value={declaredCash}
                    onChange={(e) => setDeclaredCash(e.target.value)}
                    placeholder="0,00"
                    disabled={loading}
                    autoFocus
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 rounded-2xl py-3.5 pl-12 pr-4 text-2xl font-mono font-black text-white outline-none transition shadow-inner"
                  />
                </div>
              </div>

              {/* CAMPO DE OBSERVAÇÕES / QUEBRAS */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-400 block text-left">
                  Observações / Justificação de Quebra (Opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Troco inicial divergente, sangria não registada..."
                  rows={2}
                  disabled={loading}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-white outline-none transition resize-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-600/25 border border-indigo-400/30 transition flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>A Processar Apuramento...</span>
                  </>
                ) : (
                  <>
                    <Banknote className="w-4 h-4" />
                    <span>Confirmar & Encerrar Caixa</span>
                  </>
                )}
              </button>
            </form>
          ) : (

            /* ESTADO 2: RESUMO DO APURAMENTO (TALÃO DE FECHO) */
            <div className="space-y-5">
              
              {/* CARTÃO DE RESUMO FINANCEIRO */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3 font-mono text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Fundo Inicial (Abertura):</span>
                  <span className="text-white font-bold">Kz {result.opening_amount.toLocaleString("pt-AO")}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Vendas em Dinheiro:</span>
                  <span className="text-white font-bold">Kz {result.cash_sales.toLocaleString("pt-AO")}</span>
                </div>
                <div className="h-px bg-neutral-800 my-1" />
                <div className="flex justify-between text-neutral-300 font-bold">
                  <span>Esperado pelo Sistema:</span>
                  <span>Kz {result.expected_cash.toLocaleString("pt-AO")}</span>
                </div>
                <div className="flex justify-between text-neutral-300 font-bold">
                  <span>Declarado pelo Operador:</span>
                  <span>Kz {result.declared_cash.toLocaleString("pt-AO")}</span>
                </div>
                
                {/* APURAMENTO DA DIFERENÇA (QUEBRA OU SOBRA) */}
                <div className={`p-3 rounded-xl flex justify-between items-center font-extrabold text-sm border ${
                  result.difference === 0
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : result.difference < 0
                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                    : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                }`}>
                  <span>
                    {result.difference === 0 
                      ? "Caixa Certinho" 
                      : result.difference < 0 
                      ? "Quebra de Caixa:" 
                      : "Sombra / Sobra:"}
                  </span>
                  <span>
                    {result.difference > 0 ? "+" : ""}
                    Kz {result.difference.toLocaleString("pt-AO")}
                  </span>
                </div>
              </div>

              {/* BOTÕES DE AÇÃO */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-2xl text-xs font-bold text-white transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-indigo-400" />
                  <span>Imprimir Talão</span>
                </button>

                <button
                  type="button"
                  onClick={onFinish}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/30 rounded-2xl text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Concluir & Sair</span>
                </button>
              </div>

            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ClosingCashModal;
