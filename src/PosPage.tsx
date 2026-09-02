"use client";

import React, { useState, useEffect } from "react";
import { useCashSession } from "./hooks/useCashSession";
import { OpeningCashModal } from "./components/OpeningCashModal";

export default function PosPage() {
  const [operator, setOperator] = useState<any>(null);

  // Carrega operador autenticado do localStorage
  useEffect(() => {
    const rawOp = localStorage.getItem("active_operator");
    if (rawOp) {
      try {
        setOperator(JSON.parse(rawOp));
      } catch (e) {
        console.warn("Erro ao parsear active_operator:", e);
      }
    } else {
      // Fallback para operador padrão do Masakula POS
      setOperator({
        id: "maria",
        name: "Maria Silva",
        role: "CAIXA",
      });
    }
  }, []);

  // Hook de sessão de caixa
  const { currentSession, loading, openSession } = useCashSession(operator?.id || null);

  // O modal abre se o carregamento terminou e NÃO existe sessão aberta
  const isOpeningModalOpen = !loading && operator && !currentSession;

  const handleOpenCash = async (amount: number) => {
    await openSession(amount);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 relative">
      
      {/* CONTEÚDO PRINCIPAL DO PDV */}
      <div className={isOpeningModalOpen ? "blur-sm pointer-events-none" : ""}>
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-black tracking-tight">Worscoi POS - Caixas</h1>
          {operator && (
            <div className="text-sm text-neutral-400">
              Operador: <span className="text-white font-bold">{operator.name}</span>
            </div>
          )}
        </header>

        {/* Área de Vendas / Carrinho aqui */}
        <div className="border border-neutral-800 rounded-2xl p-8 text-center text-neutral-500 bg-neutral-900/40">
          {currentSession ? (
            <div className="space-y-1">
              <p className="text-emerald-400 font-bold text-base">
                Turno Ativo #{String(currentSession.id).slice(0, 8)}
              </p>
              <p className="text-xs text-neutral-400">
                Fundo Inicial: <span className="text-white font-bold">{Number(currentSession.opening_amount || 0).toLocaleString("pt-AO")} Kz</span>
              </p>
            </div>
          ) : (
            <p>Aguardando abertura de caixa...</p>
          )}
        </div>
      </div>

      {/* MODAL DE ABERTURA BLOQUEANTE */}
      <OpeningCashModal
        isOpen={Boolean(isOpeningModalOpen)}
        operatorName={operator?.name || "Operador"}
        onOpenSession={handleOpenCash}
      />
    </div>
  );
}

export { PosPage };
