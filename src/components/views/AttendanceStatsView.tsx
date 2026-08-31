import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, TrendingUp, Award, UserCheck } from "lucide-react";

// Dados mockados de atendentes
const OPERATORS_DATA = [
  {
    id: "joao",
    name: "João Silva",
    role: "Operador Principal",
    avatar: "JS",
    weeklyHours: [
      { day: "Seg", hours: 8, maxHours: 12 },
      { day: "Ter", hours: 10, maxHours: 12 },
      { day: "Qua", hours: 7, maxHours: 12 },
      { day: "Qui", hours: 9, maxHours: 12 },
      { day: "Sex", hours: 8, maxHours: 12 },
      { day: "Sáb", hours: 6, maxHours: 12 },
    ],
    totalHours: 48,
    totalSales: 850000,
    totalProfit: 255000,
  },
  {
    id: "artur",
    name: "Artur Mendes",
    role: "Operador de Balcão",
    avatar: "AM",
    weeklyHours: [
      { day: "Seg", hours: 9, maxHours: 12 },
      { day: "Ter", hours: 10, maxHours: 12 },
      { day: "Qua", hours: 8, maxHours: 12 },
      { day: "Qui", hours: 6, maxHours: 12 },
      { day: "Sex", hours: 9, maxHours: 12 },
      { day: "Sáb", hours: 4, maxHours: 12 },
    ],
    totalHours: 46,
    totalSales: 720000,
    totalProfit: 2160000,
  },
];

export function AttendanceStatsModule() {
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>("joao");

  const currentOperator =
    OPERATORS_DATA.find((op) => op.id === selectedOperatorId) || OPERATORS_DATA[0];

  // Ordenar atendentes pelo total de horas trabalhadas (Ranking)
  const rankedOperators = [...OPERATORS_DATA].sort((a, b) => b.totalHours - a.totalHours);

  return (
    <div className="w-full bg-neutral-950 border border-neutral-800 rounded-3xl p-6 text-white space-y-6 select-none">
      
      {/* 🟢 HEADER: Título & Seletor de Atendentes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#E1FB15]/10 border border-[#E1FB15]/30 rounded-2xl">
            <Clock className="w-5 h-5 text-[#E1FB15]" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">
              Estatísticas de Tempo de Atendimento
            </h2>
            <p className="text-xs text-neutral-400">
              Carga horária semanal e rendimento por operador de caixa
            </p>
          </div>
        </div>

        {/* Tabs de Seleção de Operador */}
        <div className="flex bg-neutral-900 border border-neutral-800 p-1 rounded-2xl gap-1">
          {OPERATORS_DATA.map((op) => (
            <button
              key={op.id}
              onClick={() => setSelectedOperatorId(op.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedOperatorId === op.id
                  ? "bg-[#E1FB15] text-black shadow-md"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800"
              }`}
            >
              {op.name}
            </button>
          ))}
        </div>
      </div>

      {/* 📊 1. GRÁFICO PRINCIPAL: Cápsulas de Horas da Semana (Inspirado no vídeo) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Horas Diárias de {currentOperator.name}
          </span>
          <span className="text-xs font-black text-[#E1FB15]">
            Média: {(currentOperator.totalHours / currentOperator.weeklyHours.length).toFixed(1)}h / dia
          </span>
        </div>

        {/* Grid de Cápsulas Verticais */}
        <div className="grid grid-cols-6 gap-3 sm:gap-6 h-56 items-end">
          {currentOperator.weeklyHours.map((item, idx) => {
            const fillPercentage = (item.hours / item.maxHours) * 100;
            const isHighest = item.hours === Math.max(...currentOperator.weeklyHours.map((d) => d.hours));

            return (
              <div key={idx} className="flex flex-col items-center h-full justify-end group">
                {/* Trilho em Cápsula (Background Pill) */}
                <div className="relative w-full max-w-[56px] h-44 bg-neutral-950 rounded-full p-1.5 flex flex-col justify-end overflow-hidden border border-neutral-800">
                  {/* Preenchimento Dinâmico (Inner Fill) */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${fillPercentage}%` }}
                    transition={{ type: "spring", stiffness: 180, damping: 20 }}
                    className={`w-full rounded-full flex items-end justify-center pb-2 transition-colors ${
                      isHighest
                        ? "bg-[#E1FB15] text-black"
                        : "bg-neutral-800 text-white group-hover:bg-neutral-700"
                    }`}
                  >
                    {item.hours > 0 && (
                      <span className="text-[11px] font-black tracking-tighter">
                        {item.hours}h
                      </span>
                    )}
                  </motion.div>
                </div>

                {/* Dia da Semana */}
                <span className="text-xs font-bold text-neutral-400 mt-3 group-hover:text-white transition">
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 📉 2. CARDS INFERIORES: Somatório & Comparativo de Rendimento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARD ESQUERDO: Somatório de Horas & Ranking */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#E1FB15]" />
              <h3 className="text-sm font-bold text-white">Total de Horas Trabalhadas</h3>
            </div>
            <span className="text-[10px] text-neutral-500 font-semibold uppercase">Acumulado Semanal</span>
          </div>

          <div className="space-y-4">
            {rankedOperators.map((op, rankIndex) => (
              <div
                key={op.id}
                className={`p-3 rounded-xl border transition-all ${
                  op.id === selectedOperatorId
                    ? "bg-neutral-950 border-[#E1FB15]/50"
                    : "bg-neutral-950/60 border-neutral-800"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-neutral-800 rounded-full flex items-center justify-center text-xs font-black text-[#E1FB15]">
                      {op.avatar}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        {op.name}
                        {rankIndex === 0 && (
                          <Award className="w-3.5 h-3.5 text-[#E1FB15]" />
                        )}
                      </p>
                      <p className="text-[10px] text-neutral-400">{op.role}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-[#E1FB15]">{op.totalHours} Horas</span>
                </div>

                {/* Barra de Progresso Visual de Horas */}
                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#E1FB15] rounded-full"
                    style={{ width: `${(op.totalHours / 60) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CARD DIREITO: Comparativo (Horas vs. Faturação vs. Lucro) */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#32D583]" />
              <h3 className="text-sm font-bold text-white">Rendimento & Faturação</h3>
            </div>
            <span className="text-[10px] bg-[#32D583]/10 text-[#32D583] px-2 py-0.5 rounded-md font-bold">
              Produtividade
            </span>
          </div>

          <div className="space-y-3">
            {OPERATORS_DATA.map((op) => {
              const hourlyRevenue = Math.round(op.totalSales / op.totalHours);

              return (
                <div
                  key={op.id}
                  className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">{op.name}</span>
                    <span className="text-[11px] text-neutral-400 font-medium">
                      {op.totalHours}h de trabalho
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-800/60">
                    {/* Vendas */}
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase font-semibold">Vendeu</p>
                      <p className="text-xs font-extrabold text-white">
                        Kz {op.totalSales.toLocaleString("pt-AO")}
                      </p>
                    </div>

                    {/* Lucro */}
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase font-semibold">Lucrou</p>
                      <p className="text-xs font-extrabold text-[#32D583]">
                        Kz {op.totalProfit.toLocaleString("pt-AO")}
                      </p>
                    </div>
                  </div>

                  {/* Métrica de Eficiência por Hora */}
                  <div className="flex justify-between items-center text-[10px] bg-neutral-900 px-2.5 py-1 rounded-lg text-neutral-400 mt-0.5">
                    <span>Média por Hora:</span>
                    <span className="font-bold text-[#E1FB15]">
                      Kz {hourlyRevenue.toLocaleString("pt-AO")} / hora
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
}
