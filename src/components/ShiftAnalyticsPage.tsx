"use client";

import React, { useState } from "react";
import { 
  TrendingDown, TrendingUp, AlertTriangle, ShieldCheck, 
  Users, Calendar, Filter, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, ReferenceLine 
} from "recharts";
import { ExportAuditButtons } from "./ExportAuditButtons";
import { OperatorPerformance } from "../types/analytics";

// DADOS MOCK PARA DEMONSTRAÇÃO VISUAL
const MOCK_OPERATORS_PERFORMANCE = [
  { operatorName: "Mateus Silva", shifts: 24, totalSales: 3450000, breakage: -12500, surplus: 2000, net: -10500, accuracy: 87.5 },
  { operatorName: "Ana Joana", shifts: 28, totalSales: 4100000, breakage: -1500, surplus: 500, net: -1000, accuracy: 96.4 },
  { operatorName: "Carlos Bento", shifts: 19, totalSales: 2800000, breakage: -34000, surplus: 0, net: -34000, accuracy: 68.4 },
  { operatorName: "Teresa Dias", shifts: 22, totalSales: 3100000, breakage: -4000, surplus: 6500, net: 2500, accuracy: 90.9 },
];

const MOCK_DAILY_TREND = [
  { date: "25/Ago", "Mateus Silva": -1500, "Ana Joana": 0, "Carlos Bento": -8000, "Teresa Dias": 0 },
  { date: "26/Ago", "Mateus Silva": 0, "Ana Joana": -500, "Carlos Bento": -4500, "Teresa Dias": 1500 },
  { date: "27/Ago", "Mateus Silva": -3000, "Ana Joana": 0, "Carlos Bento": -12000, "Teresa Dias": 0 },
  { date: "28/Ago", "Mateus Silva": 0, "Ana Joana": 0, "Carlos Bento": -2000, "Teresa Dias": 5000 },
  { date: "29/Ago", "Mateus Silva": -5000, "Ana Joana": -1000, "Carlos Bento": -3500, "Teresa Dias": -4000 },
  { date: "30/Ago", "Mateus Silva": -3000, "Ana Joana": 0, "Carlos Bento": -4000, "Teresa Dias": 0 },
];

export function ShiftAnalyticsPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "month">("30d");

  // Métricas Globais do Período
  const totalQuebrasGlobal = MOCK_OPERATORS_PERFORMANCE.reduce((acc, o) => acc + o.breakage, 0);
  const totalSobrasGlobal = MOCK_OPERATORS_PERFORMANCE.reduce((acc, o) => acc + o.surplus, 0);
  const mediaAcuracia = (MOCK_OPERATORS_PERFORMANCE.reduce((acc, o) => acc + o.accuracy, 0) / MOCK_OPERATORS_PERFORMANCE.length).toFixed(1);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8 space-y-8 select-none">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Desempenho & Auditoria de Caixas</h1>
          <p className="text-xs text-neutral-400">Análise temporal de variações, quebras e acurácia de caixa por operador.</p>
        </div>

        {/* FILTROS DE PERÍODO & EXPORTAÇÃO */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setPeriod("7d")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${period === "7d" ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white"}`}
            >
              Últimos 7 dias
            </button>
            <button
              type="button"
              onClick={() => setPeriod("30d")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${period === "30d" ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-white"}`}
            >
              Últimos 30 dias
            </button>
          </div>

          <ExportAuditButtons 
            data={MOCK_OPERATORS_PERFORMANCE.map((op, idx) => ({
              operatorId: `OP-${idx + 1}`,
              operatorName: op.operatorName,
              totalShifts: op.shifts,
              totalSalesCash: Math.round(op.totalSales * 0.6),
              totalSalesCard: Math.round(op.totalSales * 0.4),
              totalSales: op.totalSales,
              totalBreakage: op.breakage,
              totalSurplus: op.surplus,
              netDifference: op.net,
              accuracyRate: op.accuracy,
            }))}
            periodLabel={period === "7d" ? "Últimos 7 dias" : "Últimos 30 dias"}
          />
        </div>
      </div>

      {/* CARDS KPIS DE AUDITORIA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
          <div className="flex justify-between items-center text-neutral-400 text-xs font-semibold mb-2">
            <span>Volume de Quebras (Faltas)</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {totalQuebrasGlobal.toLocaleString("pt-AO")} Kz
          </div>
          <span className="text-[10px] text-neutral-500">Perdas acumuladas no período</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
          <div className="flex justify-between items-center text-neutral-400 text-xs font-semibold mb-2">
            <span>Volume de Sobras</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            +{totalSobrasGlobal.toLocaleString("pt-AO")} Kz
          </div>
          <span className="text-[10px] text-neutral-500">Excedentes registados no fecho</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
          <div className="flex justify-between items-center text-neutral-400 text-xs font-semibold mb-2">
            <span>Média de Acurácia de Caixa</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {mediaAcuracia}%
          </div>
          <span className="text-[10px] text-neutral-500">Turnos fechados sem divergência</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
          <div className="flex justify-between items-center text-neutral-400 text-xs font-semibold mb-2">
            <span>Operador com Maior Desvio</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-amber-400 truncate">
            Carlos Bento
          </div>
          <span className="text-[10px] text-neutral-500">Acumulado: -34.000 Kz em 19 turnos</span>
        </div>
      </div>

      {/* PAINEL DE GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GRÁFICO 1: COMPARATIVO DE QUEBRAS E SOBRAS POR OPERADOR */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Balanço de Divergências por Operador</h3>
            <p className="text-xs text-neutral-400">Comparação entre o total de Quebras (Faltas) e Sobras por operador (Kz)</p>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_OPERATORS_PERFORMANCE} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="operatorName" stroke="#737373" fontSize={11} tickLine={false} />
                <YAxis stroke="#737373" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#171717", borderColor: "#262626", borderRadius: "12px", fontSize: "12px" }} 
                  formatter={(value: any) => [`${Number(value).toLocaleString("pt-AO")} Kz`]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <ReferenceLine y={0} stroke="#404040" />
                <Bar dataKey="breakage" name="Quebras (Faltas)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="surplus" name="Sobras" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 2: EVOLUÇÃO TEMPORAL DE DESVIOS POR OPERADOR */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Evolução Diária de Divergências</h3>
            <p className="text-xs text-neutral-400">Histórico de variação diária de caixa por operador</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_DAILY_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="date" stroke="#737373" fontSize={11} tickLine={false} />
                <YAxis stroke="#737373" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#171717", borderColor: "#262626", borderRadius: "12px", fontSize: "12px" }}
                  formatter={(value: any) => [`${Number(value).toLocaleString("pt-AO")} Kz`]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <ReferenceLine y={0} stroke="#404040" />
                <Line type="monotone" dataKey="Mateus Silva" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Ana Joana" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Carlos Bento" stroke="#f43f5e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Teresa Dias" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* TABELA DE MATRIZ DE DESEMPENHO E AUDITORIA */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-neutral-800">
          <h3 className="text-sm font-bold text-white">Matriz Individual de Auditoria e Vendas</h3>
          <p className="text-xs text-neutral-400">Resumo consolidado por operador no período selecionado</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950/60 text-neutral-400 uppercase font-mono border-b border-neutral-800">
              <tr>
                <th className="p-4">Operador</th>
                <th className="p-4 text-center">Turnos Fechados</th>
                <th className="p-4 text-right">Volume de Vendas</th>
                <th className="p-4 text-right">Total Quebras</th>
                <th className="p-4 text-right">Total Sobras</th>
                <th className="p-4 text-right">Saldo Líquido</th>
                <th className="p-4 text-center">Taxa de Precisão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {MOCK_OPERATORS_PERFORMANCE.map((op, idx) => (
                <tr key={idx} className="hover:bg-neutral-800/30 transition">
                  <td className="p-4 font-bold text-white">{op.operatorName}</td>
                  <td className="p-4 text-center font-mono">{op.shifts}</td>
                  <td className="p-4 text-right font-mono font-semibold text-white">
                    {op.totalSales.toLocaleString("pt-AO")} Kz
                  </td>
                  <td className="p-4 text-right font-mono text-rose-400 font-bold">
                    {op.breakage.toLocaleString("pt-AO")} Kz
                  </td>
                  <td className="p-4 text-right font-mono text-emerald-400">
                    +{op.surplus.toLocaleString("pt-AO")} Kz
                  </td>
                  <td className="p-4 text-right font-mono font-bold">
                    <span className={op.net < 0 ? "text-rose-400" : op.net > 0 ? "text-emerald-400" : "text-neutral-400"}>
                      {op.net.toLocaleString("pt-AO")} Kz
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold border ${
                      op.accuracy >= 90
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : op.accuracy >= 80
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}>
                      {op.accuracy}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default ShiftAnalyticsPage;
