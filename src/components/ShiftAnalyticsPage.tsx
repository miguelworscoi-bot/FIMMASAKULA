"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  TrendingDown, TrendingUp, AlertTriangle, ShieldCheck, 
  Users, Calendar, Filter, ArrowUpRight, ArrowDownRight, Sparkles, Activity
} from "lucide-react";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, ReferenceLine 
} from "recharts";
import { ExportAuditButtons } from "./ExportAuditButtons";
import { BreakageSummaryCharts } from "./BreakageSummaryCharts";
import { useBreakageSummary } from "../hooks/useBreakageSummary";
import { BreakageReasonSummary } from "../types/audit";
import { OperatorPerformance } from "../types/analytics";

// DADOS MOCK DE DIVERGÊNCIAS POR MOTIVO
const MOCK_BREAKAGE_REASONS: BreakageReasonSummary[] = [
  {
    period_month: "2026-09-01",
    store_id: "store_main",
    divergence_reason: "damaged",
    distinct_products_affected: 8,
    total_qty_lost: 14,
    total_amount_lost: 18500,
    percentage_of_monthly_loss: 35.6,
  },
  {
    period_month: "2026-09-01",
    store_id: "store_main",
    divergence_reason: "expired",
    distinct_products_affected: 5,
    total_qty_lost: 11,
    total_amount_lost: 14200,
    percentage_of_monthly_loss: 27.3,
  },
  {
    period_month: "2026-09-01",
    store_id: "store_main",
    divergence_reason: "stolen",
    distinct_products_affected: 2,
    total_qty_lost: 3,
    total_amount_lost: 9800,
    percentage_of_monthly_loss: 18.8,
  },
  {
    period_month: "2026-09-01",
    store_id: "store_main",
    divergence_reason: "misplaced",
    distinct_products_affected: 3,
    total_qty_lost: 4,
    total_amount_lost: 5000,
    percentage_of_monthly_loss: 9.6,
  },
  {
    period_month: "2026-09-01",
    store_id: "store_main",
    divergence_reason: "system_error",
    distinct_products_affected: 2,
    total_qty_lost: 2,
    total_amount_lost: 2900,
    percentage_of_monthly_loss: 5.6,
  },
  {
    period_month: "2026-09-01",
    store_id: "store_main",
    divergence_reason: "untracked_use",
    distinct_products_affected: 1,
    total_qty_lost: 2,
    total_amount_lost: 1600,
    percentage_of_monthly_loss: 3.1,
  },
];

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
  const [livePulseTick, setLivePulseTick] = useState<number>(0);

  // Consulta do resumo de quebras por motivo
  const { data: remoteBreakageData, loading: breakageLoading } = useBreakageSummary({
    periodMonth: "2026-09-01",
  });

  const breakageData = (remoteBreakageData && remoteBreakageData.length > 0)
    ? remoteBreakageData
    : MOCK_BREAKAGE_REASONS;

  // Atualização de pulso autônomo a cada 4 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setLivePulseTick((prev) => (prev + 1) % 100);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Métricas Globais do Período
  const totalQuebrasGlobal = MOCK_OPERATORS_PERFORMANCE.reduce((acc, o) => acc + o.breakage, 0);
  const totalSobrasGlobal = MOCK_OPERATORS_PERFORMANCE.reduce((acc, o) => acc + o.surplus, 0);
  const mediaAcuracia = (MOCK_OPERATORS_PERFORMANCE.reduce((acc, o) => acc + o.accuracy, 0) / MOCK_OPERATORS_PERFORMANCE.length).toFixed(1);

  return (
    <div className="min-h-screen bg-white text-zinc-900 p-6 md:p-8 space-y-8 select-none">
      
      {/* CABEÇALHO */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Desempenho & Auditoria de Caixas</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Tempo Real
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">Análise temporal de variações, quebras e acurácia de caixa por operador em Kwanzas (Kz).</p>
        </div>

        {/* FILTROS DE PERÍODO & EXPORTAÇÃO */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-2xl border border-zinc-200">
            <button
              type="button"
              onClick={() => setPeriod("7d")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                period === "7d" ? "bg-zinc-900 text-white shadow-xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Últimos 7 dias
            </button>
            <button
              type="button"
              onClick={() => setPeriod("30d")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                period === "30d" ? "bg-zinc-900 text-white shadow-xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
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
      </motion.div>

      {/* CARDS KPIS DE AUDITORIA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          whileHover={{ y: -2 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all"
        >
          <div className="flex justify-between items-center text-zinc-500 text-xs font-bold mb-2">
            <span>Volume de Quebras (Faltas)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">
            {totalQuebrasGlobal.toLocaleString("pt-AO")} Kz
          </div>
          <span className="text-[11px] font-medium text-zinc-500 mt-1 block">Perdas acumuladas no período</span>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all"
        >
          <div className="flex justify-between items-center text-zinc-500 text-xs font-bold mb-2">
            <span>Volume de Sobras</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            +{totalSobrasGlobal.toLocaleString("pt-AO")} Kz
          </div>
          <span className="text-[11px] font-medium text-zinc-500 mt-1 block">Excedentes registados no fecho</span>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all"
        >
          <div className="flex justify-between items-center text-zinc-500 text-xs font-bold mb-2">
            <span>Média de Acurácia de Caixa</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-900 font-mono">
            {mediaAcuracia}%
          </div>
          <span className="text-[11px] font-medium text-zinc-500 mt-1 block">Turnos fechados sem divergência</span>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all"
        >
          <div className="flex justify-between items-center text-zinc-500 text-xs font-bold mb-2">
            <span>Operador com Maior Desvio</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-lg font-black text-amber-600 truncate">
            Carlos Bento
          </div>
          <span className="text-[11px] font-medium text-zinc-500 mt-1 block">Acumulado: -34.000 Kz em 19 turnos</span>
        </motion.div>
      </div>

      {/* PAINEL DE GRÁFICOS (COM ANIMAÇÕES AUTÔNOMAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GRÁFICO 1: COMPARATIVO DE QUEBRAS E SOBRAS POR OPERADOR */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs hover:shadow-md transition-shadow space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Balanço de Divergências por Operador</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Comparação entre o total de Quebras (Faltas) e Sobras por operador (Kz)</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
              Kz Líquido
            </span>
          </div>
          
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_OPERATORS_PERFORMANCE} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="operatorName" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e5e7eb", borderRadius: "14px", fontSize: "12px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }} 
                  formatter={(value: any) => [`${Number(value).toLocaleString("pt-AO")} Kz`]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <ReferenceLine y={0} stroke="#d1d5db" />
                <Bar 
                  dataKey="breakage" 
                  name="Quebras (Faltas)" 
                  fill="#f43f5e" 
                  radius={[6, 6, 0, 0]} 
                  isAnimationActive={true}
                  animationDuration={1600}
                  animationEasing="ease-out"
                />
                <Bar 
                  dataKey="surplus" 
                  name="Sobras" 
                  fill="#10b981" 
                  radius={[6, 6, 0, 0]} 
                  isAnimationActive={true}
                  animationDuration={1800}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* GRÁFICO 2: EVOLUÇÃO TEMPORAL DE DESVIOS POR OPERADOR */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs hover:shadow-md transition-shadow space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Evolução Diária de Divergências</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Histórico contínuo de variação diária de caixa por operador</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
              Tendência
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_DAILY_TREND} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e5e7eb", borderRadius: "14px", fontSize: "12px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                  formatter={(value: any) => [`${Number(value).toLocaleString("pt-AO")} Kz`]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <ReferenceLine y={0} stroke="#d1d5db" />
                <Line 
                  type="monotone" 
                  dataKey="Mateus Silva" 
                  stroke="#6366f1" 
                  strokeWidth={2.5} 
                  dot={{ r: 3, fill: '#6366f1' }} 
                  isAnimationActive={true}
                  animationDuration={1500}
                />
                <Line 
                  type="monotone" 
                  dataKey="Ana Joana" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  dot={{ r: 3, fill: '#10b981' }} 
                  isAnimationActive={true}
                  animationDuration={1700}
                />
                <Line 
                  type="monotone" 
                  dataKey="Carlos Bento" 
                  stroke="#f43f5e" 
                  strokeWidth={2.5} 
                  dot={{ r: 3, fill: '#f43f5e' }} 
                  isAnimationActive={true}
                  animationDuration={1900}
                />
                <Line 
                  type="monotone" 
                  dataKey="Teresa Dias" 
                  stroke="#f59e0b" 
                  strokeWidth={2.5} 
                  dot={{ r: 3, fill: '#f59e0b' }} 
                  isAnimationActive={true}
                  animationDuration={2100}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>

      {/* SEÇÃO DE AUDITORIA DE QUEBRAS POR MOTIVO (COM ROASCA E BARRAS AUTO-ANIMADOS) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h2 className="text-lg font-black text-zinc-950 tracking-tight">Auditoria & Quebras por Motivo</h2>
            <p className="text-xs text-zinc-500">Distribuição percentual e valor financeiro perdido por categoria de divergência</p>
          </div>
          <span className="text-xs font-mono font-semibold px-3 py-1 bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-700">
            Período: Setembro 2026
          </span>
        </div>

        <BreakageSummaryCharts data={breakageData} isLoading={breakageLoading} />
      </div>

      {/* TABELA DE MATRIZ DE DESEMPENHO E AUDITORIA */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-shadow"
      >
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Matriz Individual de Auditoria e Vendas</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Resumo consolidado por operador no período selecionado</p>
          </div>
          <span className="text-xs font-medium text-zinc-500">
            {MOCK_OPERATORS_PERFORMANCE.length} Operadores Ativos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-700">
            <thead className="bg-zinc-50 text-zinc-500 uppercase font-mono border-b border-gray-200">
              <tr>
                <th className="p-4 font-bold">Operador</th>
                <th className="p-4 text-center font-bold">Turnos Fechados</th>
                <th className="p-4 text-right font-bold">Volume de Vendas</th>
                <th className="p-4 text-right font-bold">Total Quebras</th>
                <th className="p-4 text-right font-bold">Total Sobras</th>
                <th className="p-4 text-right font-bold">Saldo Líquido</th>
                <th className="p-4 text-center font-bold">Taxa de Precisão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_OPERATORS_PERFORMANCE.map((op, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/70 transition-colors">
                  <td className="p-4 font-bold text-zinc-900">{op.operatorName}</td>
                  <td className="p-4 text-center font-mono font-medium text-zinc-600">{op.shifts}</td>
                  <td className="p-4 text-right font-mono font-semibold text-zinc-900">
                    {op.totalSales.toLocaleString("pt-AO")} Kz
                  </td>
                  <td className="p-4 text-right font-mono text-rose-600 font-bold">
                    {op.breakage.toLocaleString("pt-AO")} Kz
                  </td>
                  <td className="p-4 text-right font-mono text-emerald-600 font-bold">
                    +{op.surplus.toLocaleString("pt-AO")} Kz
                  </td>
                  <td className="p-4 text-right font-mono font-bold">
                    <span className={op.net < 0 ? "text-rose-600" : op.net > 0 ? "text-emerald-600" : "text-zinc-500"}>
                      {op.net.toLocaleString("pt-AO")} Kz
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold border ${
                      op.accuracy >= 90
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : op.accuracy >= 80
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}>
                      {op.accuracy}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

    </div>
  );
}

export default ShiftAnalyticsPage;

