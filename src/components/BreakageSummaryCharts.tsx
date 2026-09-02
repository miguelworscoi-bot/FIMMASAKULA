import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Sector,
} from "recharts";
import { Sparkles, TrendingDown, Layers, AlertCircle } from "lucide-react";
import { BreakageReasonSummary, DivergenceReason } from "../types/audit";

const REASON_CONFIG: Record<DivergenceReason, { label: string; color: string; bgSoft: string }> = {
  damaged: { label: "Danificado", color: "#f43f5e", bgSoft: "#fff1f2" },
  expired: { label: "Validade Expirada", color: "#eab308", bgSoft: "#fefce8" },
  stolen: { label: "Furto / Roubo", color: "#a855f7", bgSoft: "#faf5ff" },
  misplaced: { label: "Extravio", color: "#06b6d4", bgSoft: "#ecfeff" },
  system_error: { label: "Erro de Sistema", color: "#3b82f6", bgSoft: "#eff6ff" },
  untracked_use: { label: "Uso Interno", color: "#10b981", bgSoft: "#ecfdf5" },
  other: { label: "Outros", color: "#6b7280", bgSoft: "#f3f4f6" },
};

interface Props {
  data: BreakageReasonSummary[];
  isLoading?: boolean;
}

// Renderizador customizado para destaque animado autônomo da fatia ativa
const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
  } = props;

  return (
    <g>
      {/* Halo brilhante pulsante */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        fillOpacity={0.25}
      />
      {/* Setor principal expandido */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      {/* Centro dinâmico com valor em tempo real */}
      <circle cx={cx} cy={cy} r={innerRadius - 8} fill="#ffffff" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))" />
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#09090b" className="text-xs font-black" style={{ fontSize: '13px', fontWeight: 800 }}>
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#71717a" className="text-[10px] font-medium" style={{ fontSize: '10px' }}>
        {payload.name?.length > 11 ? `${payload.name.slice(0, 10)}...` : payload.name}
      </text>
    </g>
  );
};

export function BreakageSummaryCharts({ data, isLoading }: Props) {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  // Formatar dados para o Recharts
  const chartData = useMemo(() => {
    return data.map((item) => {
      const config = REASON_CONFIG[item.divergence_reason] || REASON_CONFIG.other;
      return {
        ...item,
        name: config.label,
        color: config.color,
        bgSoft: config.bgSoft,
        formattedAmount: `${Number(item.total_amount_lost).toLocaleString("pt-AO")} Kz`,
      };
    });
  }, [data]);

  const totalLoss = useMemo(() => {
    return data.reduce((acc, curr) => acc + Number(curr.total_amount_lost), 0);
  }, [data]);

  // ANIMAÇÃO AUTÔNOMA: Percorre automaticamente as fatias do gráfico a cada 3 segundos
  useEffect(() => {
    if (!chartData || chartData.length === 0 || !autoRotate) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % chartData.length);
    }, 3200);

    return () => clearInterval(interval);
  }, [chartData, autoRotate]);

  if (isLoading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-gray-200 bg-white p-6 text-zinc-500 shadow-xs">
        <div className="h-7 w-7 animate-spin rounded-full border-3 border-emerald-500 border-t-transparent" />
        <span className="ml-3 text-sm font-medium">A carregar dados de auditoria...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-6 text-center text-zinc-500 shadow-xs">
        <AlertCircle className="w-8 h-8 text-zinc-400 mb-2" />
        <p className="text-sm font-semibold text-zinc-800">Nenhuma quebra registada no período selecionado.</p>
        <p className="text-xs text-zinc-500 mt-1">As auditorias aprovadas aparecerão automaticamente aqui.</p>
      </div>
    );
  }

  const currentActiveItem = chartData[activeIndex] || chartData[0];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 1. Gráfico de Rosca: Distribuição Percentual com Auto-Animação */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-xs hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900">Distribuição de Perdas</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Auto-Animação
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">Proporção por motivo da divergência</p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-medium text-zinc-500">Total Perdas</span>
            <p className="text-sm font-black text-rose-600 font-mono">
              {totalLoss.toLocaleString("pt-AO")} Kz
            </p>
          </div>
        </div>

        {/* Destaque flutuante animado do item ativo atual */}
        <div className="my-2 p-2.5 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span 
              className="w-3 h-3 rounded-full shrink-0 shadow-xs transition-colors duration-500" 
              style={{ backgroundColor: currentActiveItem?.color }}
            />
            <div>
              <p className="text-xs font-bold text-zinc-900">{currentActiveItem?.name}</p>
              <p className="text-[11px] text-zinc-500">
                {currentActiveItem?.distinct_products_affected} produtos afetados • {currentActiveItem?.total_qty_lost} un.
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-black text-rose-600 font-mono">{currentActiveItem?.formattedAmount}</span>
            <p className="text-[10px] font-bold text-zinc-500">{currentActiveItem?.percentage_of_monthly_loss}% do total</p>
          </div>
        </div>

        <div className="relative h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={chartData}
                dataKey="total_amount_lost"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={82}
                paddingAngle={4}
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
                onMouseEnter={(_, index) => {
                  setAutoRotate(false);
                  setActiveIndex(index);
                }}
                onMouseLeave={() => setAutoRotate(true)}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    stroke="#ffffff" 
                    strokeWidth={2} 
                    className="transition-all duration-300"
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as (typeof chartData)[0];
                    return (
                      <div className="rounded-xl border border-gray-200 bg-white p-3 text-xs shadow-xl ring-1 ring-black/5">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                          <p className="font-bold text-zinc-900">{data.name}</p>
                        </div>
                        <p className="text-zinc-600">
                          Valor perdido: <span className="font-bold text-rose-600">{data.formattedAmount}</span>
                        </p>
                        <p className="text-zinc-500">
                          Participação: <span className="font-semibold text-zinc-900">{data.percentage_of_monthly_loss}%</span>
                        </p>
                        <p className="text-zinc-500">
                          Produtos afetados: <span className="font-semibold text-zinc-900">{data.distinct_products_affected}</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string, entry: any) => {
                  const isCurrent = chartData[activeIndex]?.name === value;
                  return (
                    <span className={`text-xs transition-colors cursor-pointer ${isCurrent ? 'font-black text-zinc-900 underline' : 'font-medium text-zinc-600'}`}>
                      {value}
                    </span>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 2. Gráfico de Barras: Valor Financeiro por Motivo com Barras Animadas */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-xs hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-900">Impacto Financeiro Absoluto</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                <Layers className="w-3 h-3" />
                Kwanzas (Kz)
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">Valor acumulado perdido por motivo</p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-medium text-zinc-500">Categorias</span>
            <p className="text-sm font-black text-zinc-900 font-mono">
              {chartData.length} motivos
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 25 }}>
              <defs>
                {chartData.map((entry, idx) => (
                  <linearGradient key={`grad-${idx}`} id={`barGrad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                    <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis
                dataKey="name"
                stroke="#9ca3af"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
                interval={0}
                angle={-20}
                textAnchor="end"
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k Kz`}
              />
              <Tooltip
                cursor={{ fill: "rgba(0, 0, 0, 0.03)" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as (typeof chartData)[0];
                    return (
                      <div className="rounded-xl border border-gray-200 bg-white p-3 text-xs shadow-xl ring-1 ring-black/5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                          <p className="font-bold text-zinc-900">{data.name}</p>
                        </div>
                        <p className="mt-1 text-rose-600 font-black text-sm">{data.formattedAmount}</p>
                        <p className="text-zinc-500 mt-0.5">Total Unidades Perdidas: <span className="font-semibold text-zinc-800">{data.total_qty_lost}</span></p>
                        <p className="text-zinc-500">Representação: <span className="font-semibold text-zinc-800">{data.percentage_of_monthly_loss}%</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="total_amount_lost" 
                radius={[8, 8, 2, 2]}
                isAnimationActive={true}
                animationDuration={1500}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`bar-${index}`} 
                    fill={`url(#barGrad-${index})`}
                    stroke={index === activeIndex ? "#18181b" : "transparent"}
                    strokeWidth={index === activeIndex ? 2 : 0}
                    className="transition-all duration-300"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}

export default BreakageSummaryCharts;

