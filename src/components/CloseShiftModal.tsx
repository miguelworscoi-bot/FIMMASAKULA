"use client";

import React, { useState } from "react";
import { Vault, AlertTriangle, CheckCircle2, Calculator, Printer, X, Loader2 } from "lucide-react";

interface CloseShiftModalProps {
  shiftId: string;
  initialCash: number;
  salesCashEstimate: number;
  totalSangria: number;
  totalReforco: number;
  onClose: () => void;
  onSuccess: (reportZ: any) => void;
}

export function CloseShiftModal({
  shiftId,
  initialCash,
  salesCashEstimate,
  totalSangria,
  totalReforco,
  onClose,
  onSuccess,
}: CloseShiftModalProps) {
  const [actualCash, setActualCash] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [reportZData, setReportZData] = useState<any | null>(null);

  // Cálculo prévio em tempo real no frontend
  const expectedCash = initialCash + salesCashEstimate + totalReforco - totalSangria;
  const counted = parseFloat(actualCash) || 0;
  const tempDiff = counted - expectedCash;

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/shifts/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shift_id: shiftId,
          actual_cash: counted,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setReportZData(data.reportZ);
      onSuccess(data.reportZ);
    } catch (err: any) {
      alert(err.message || "Erro ao encerrar turno");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative">
        
        {/* CABEÇALHO */}
        <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold">
              <Vault className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Fecho de Caixa & Relatório Z</h3>
              <p className="text-[11px] text-neutral-400">Apuramento de valores e encerramento do turno</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 text-neutral-500 hover:text-white rounded-xl bg-neutral-950 border border-neutral-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!reportZData ? (
          /* FORMULÁRIO DE CONTAGEM FÍSICA */
          <form onSubmit={handleCloseShift} className="space-y-5">
            {/* RESUMO DOS VALORES SISTÊMICOS */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <span className="text-neutral-500 block text-[10px]">Fundo Inicial</span>
                <span className="text-white font-bold">{initialCash.toLocaleString("pt-AO")} Kz</span>
              </div>
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <span className="text-neutral-500 block text-[10px]">Vendas Dinheiro (Est.)</span>
                <span className="text-emerald-400 font-bold">+{salesCashEstimate.toLocaleString("pt-AO")} Kz</span>
              </div>
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <span className="text-neutral-500 block text-[10px]">Sangrias / Reforços</span>
                <span className="text-neutral-300 font-bold">-{totalSangria.toLocaleString()} / +{totalReforco.toLocaleString()}</span>
              </div>
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <span className="text-neutral-500 block text-[10px]">Saldo Esperado</span>
                <span className="text-indigo-400 font-bold">{expectedCash.toLocaleString("pt-AO")} Kz</span>
              </div>
            </div>

            {/* ENTRADA DA CONTAGEM REAL */}
            <div>
              <label className="text-xs font-bold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-indigo-400" />
                Valor Contado na Gaveta (Valor Real - Kz)
              </label>
              <input
                type="number"
                step="10"
                required
                placeholder="0.00"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-xl font-mono font-black text-white outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* ALERTA DE DIFERENÇA (QUEBRA / SOBRA) */}
            {actualCash !== "" && (
              <div className={`p-4 rounded-xl border text-xs font-mono flex items-center justify-between ${
                tempDiff === 0 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                  : tempDiff < 0 
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-400" 
                  : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
              }`}>
                <div className="flex items-center gap-2">
                  {tempDiff === 0 ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{tempDiff === 0 ? "Caixa Exato" : tempDiff < 0 ? "Quebra de Caixa" : "Sobra de Caixa"}</span>
                </div>
                <span className="font-bold text-sm">{tempDiff.toLocaleString("pt-AO")} Kz</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || actualCash === ""}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Encerrar Turno e Gerar Relatório Z"}
            </button>
          </form>
        ) : (
          /* RESUMO FINAL RELATÓRIO Z GENERATED */
          <div className="space-y-5">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs text-center font-bold">
              Turno Encerrado com Sucesso!
            </div>

            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-neutral-400">
                <span>Vendas Totais:</span>
                <span className="text-white font-bold">{reportZData.totalSales.toLocaleString("pt-AO")} Kz</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Total Dinheiro Esperado:</span>
                <span className="text-white font-bold">{reportZData.expectedCash.toLocaleString("pt-AO")} Kz</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Total Dinheiro Contado:</span>
                <span className="text-white font-bold">{reportZData.actualCash.toLocaleString("pt-AO")} Kz</span>
              </div>
              <div className="border-t border-neutral-800 pt-2 flex justify-between font-bold">
                <span>Diferença Final (Z):</span>
                <span className={reportZData.difference < 0 ? "text-rose-400" : "text-emerald-400"}>
                  {reportZData.difference.toLocaleString("pt-AO")} Kz
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert("Comando ESC/POS enviado para a impressora.")}
              className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              Imprimir Relatório Z (ESC/POS)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CloseShiftModal;
