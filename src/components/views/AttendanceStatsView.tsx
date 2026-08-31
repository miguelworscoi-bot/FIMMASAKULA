import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, TrendingUp, Award, UserCheck, Calendar } from 'lucide-react';
import { formatKz } from '../../utils/formatters';

// Dados de atendentes com carga horária e rendimento
export const OPERATORS_ATTENDANCE_DATA = [
  {
    id: 'maria',
    name: 'Maria Silva',
    role: 'Atendente Sénior',
    avatar: 'MS',
    weeklyHours: [
      { day: 'Seg', hours: 8.5, maxHours: 12 },
      { day: 'Ter', hours: 10, maxHours: 12 },
      { day: 'Qua', hours: 8, maxHours: 12 },
      { day: 'Qui', hours: 9.5, maxHours: 12 },
      { day: 'Sex', hours: 9, maxHours: 12 },
      { day: 'Sáb', hours: 7, maxHours: 12 },
    ],
    totalHours: 52,
    totalSales: 1250000,
    totalProfit: 410000,
  },
  {
    id: 'joao',
    name: 'João Silva',
    role: 'Operador Principal',
    avatar: 'JS',
    weeklyHours: [
      { day: 'Seg', hours: 8, maxHours: 12 },
      { day: 'Ter', hours: 10, maxHours: 12 },
      { day: 'Qua', hours: 7, maxHours: 12 },
      { day: 'Qui', hours: 9, maxHours: 12 },
      { day: 'Sex', hours: 8, maxHours: 12 },
      { day: 'Sáb', hours: 6, maxHours: 12 },
    ],
    totalHours: 48,
    totalSales: 850000,
    totalProfit: 255000,
  },
  {
    id: 'artur',
    name: 'Artur Mendes',
    role: 'Operador de Balcão',
    avatar: 'AM',
    weeklyHours: [
      { day: 'Seg', hours: 9, maxHours: 12 },
      { day: 'Ter', hours: 10, maxHours: 12 },
      { day: 'Qua', hours: 8, maxHours: 12 },
      { day: 'Qui', hours: 6, maxHours: 12 },
      { day: 'Sex', hours: 9, maxHours: 12 },
      { day: 'Sáb', hours: 4, maxHours: 12 },
    ],
    totalHours: 46,
    totalSales: 720000,
    totalProfit: 216000,
  },
];

export const AttendanceStatsModule: React.FC = () => {
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('maria');

  const currentOperator =
    OPERATORS_ATTENDANCE_DATA.find((op) => op.id === selectedOperatorId) || OPERATORS_ATTENDANCE_DATA[0];

  // Ordenar atendentes pelo total de horas trabalhadas (Ranking)
  const rankedOperators = [...OPERATORS_ATTENDANCE_DATA].sort((a, b) => b.totalHours - a.totalHours);

  return (
    <div className="w-full space-y-6 select-none">
      {/* 📊 1. GRÁFICO PRINCIPAL: Cápsulas de Horas da Semana em Fundo Branco */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-7 shadow-xs">
        {/* Header do Módulo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-950 text-white rounded-2xl flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5 text-[#E1FB15]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-950">
                Estatísticas de Tempo de Atendimento
              </h2>
              <p className="text-xs text-zinc-400">
                Carga horária semanal e rendimento por operador de caixa
              </p>
            </div>
          </div>

          {/* Tabs de Seleção de Operador */}
          <div className="flex bg-zinc-100/80 p-1 rounded-2xl gap-1 border border-zinc-200/50 flex-wrap">
            {OPERATORS_ATTENDANCE_DATA.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => setSelectedOperatorId(op.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedOperatorId === op.id
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/80'
                }`}
              >
                {op.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Horas Diárias de {currentOperator.name}
            </span>
            <span className="text-[10px] bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md font-bold">
              {currentOperator.role}
            </span>
          </div>
          <span className="text-xs font-black text-zinc-950 bg-zinc-50 border border-gray-200 px-3 py-1 rounded-xl">
            Média: <span className="text-emerald-600">{(currentOperator.totalHours / currentOperator.weeklyHours.length).toFixed(1)}h</span> / dia
          </span>
        </div>

        {/* Grid de Cápsulas Verticais com Fundo Claro */}
        <div className="grid grid-cols-6 gap-3 sm:gap-6 h-56 items-end pt-2">
          {currentOperator.weeklyHours.map((item, idx) => {
            const fillPercentage = (item.hours / item.maxHours) * 100;
            const isHighest = item.hours === Math.max(...currentOperator.weeklyHours.map((d) => d.hours));

            return (
              <div key={idx} className="flex flex-col items-center h-full justify-end group">
                {/* Trilho em Cápsula (Background Pill) */}
                <div className="relative w-full max-w-[56px] h-44 bg-zinc-100 rounded-full p-1.5 flex flex-col justify-end overflow-hidden border border-zinc-200/80 shadow-inner">
                  {/* Preenchimento Dinâmico (Inner Fill) */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${fillPercentage}%` }}
                    transition={{ type: 'spring', stiffness: 180, damping: 20 }}
                    className={`w-full rounded-full flex items-end justify-center pb-2.5 transition-colors shadow-xs ${
                      isHighest
                        ? 'bg-zinc-950 text-[#E1FB15]'
                        : 'bg-zinc-800 text-white group-hover:bg-zinc-700'
                    }`}
                  >
                    {item.hours > 0 && (
                      <span className="text-[11px] font-black tracking-tight">
                        {item.hours}h
                      </span>
                    )}
                  </motion.div>
                </div>

                {/* Dia da Semana */}
                <span className="text-xs font-bold text-zinc-400 mt-3 group-hover:text-zinc-900 transition">
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 📉 2. CARDS INFERIORES: Somatório & Comparativo de Rendimento em Fundo Branco */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD ESQUERDO: Somatório de Horas & Ranking */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-950">Total de Horas Trabalhadas</h3>
                <p className="text-xs text-zinc-400">Acumulado semanal da equipa</p>
              </div>
            </div>
            <span className="text-[10px] bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-lg font-bold uppercase">
              Semanal
            </span>
          </div>

          <div className="space-y-3.5">
            {rankedOperators.map((op, rankIndex) => (
              <div
                key={op.id}
                onClick={() => setSelectedOperatorId(op.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  op.id === selectedOperatorId
                    ? 'bg-zinc-50/90 border-zinc-950 ring-1 ring-zinc-950/10'
                    : 'bg-white border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-950 rounded-xl flex items-center justify-center text-xs font-black text-[#E1FB15]">
                      {op.avatar}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-950 flex items-center gap-1.5">
                        {op.name}
                        {rankIndex === 0 && (
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                        )}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-medium">{op.role}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-zinc-950">{op.totalHours} Horas</span>
                </div>

                {/* Barra de Progresso Visual de Horas */}
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-950 rounded-full transition-all duration-700"
                    style={{ width: `${(op.totalHours / 60) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CARD DIREITO: Comparativo (Horas vs. Faturação vs. Lucro) */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-950">Rendimento & Faturação</h3>
                <p className="text-xs text-zinc-400">Eficiência e conversão de caixa</p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg font-bold">
              Produtividade
            </span>
          </div>

          <div className="space-y-3.5">
            {OPERATORS_ATTENDANCE_DATA.map((op) => {
              const hourlyRevenue = Math.round(op.totalSales / op.totalHours);

              return (
                <div
                  key={op.id}
                  className="p-3.5 bg-zinc-50/70 rounded-2xl border border-gray-100 flex flex-col gap-2.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-950">{op.name}</span>
                    <span className="text-[11px] text-zinc-500 font-semibold">
                      {op.totalHours}h trabalhadas
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200/60">
                    {/* Vendas */}
                    <div>
                      <p className="text-[10px] text-zinc-400 uppercase font-bold">Vendeu</p>
                      <p className="text-xs font-extrabold text-zinc-950">
                        {formatKz(op.totalSales)}
                      </p>
                    </div>

                    {/* Lucro */}
                    <div>
                      <p className="text-[10px] text-zinc-400 uppercase font-bold">Lucrou</p>
                      <p className="text-xs font-extrabold text-emerald-600">
                        {formatKz(op.totalProfit)}
                      </p>
                    </div>
                  </div>

                  {/* Métrica de Eficiência por Hora */}
                  <div className="flex justify-between items-center text-[11px] bg-white border border-gray-200/80 px-3 py-1.5 rounded-xl text-zinc-600 mt-0.5">
                    <span className="font-medium text-zinc-500">Média por Hora:</span>
                    <span className="font-extrabold text-zinc-950">
                      {formatKz(hourlyRevenue)} / hora
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

