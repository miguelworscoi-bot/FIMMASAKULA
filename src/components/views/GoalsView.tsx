import React, { useState, useMemo } from 'react';
import { Plus, Target, TrendingUp, Check } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { formatKz } from '../../utils/formatters';
import { CreateGoalModal, NewGoalDTO } from '../admin/CreateGoalModal';

// Dados simulados de desempenho temporal (Gráfico)
const PERFORMANCE_DATA = [
  { time: '08:00', sales: 45000, profit: 12000 },
  { time: '10:00', sales: 120000, profit: 38000 },
  { time: '12:00', sales: 95000, profit: 29000 },
  { time: '14:00', sales: 210000, profit: 64000 },
  { time: '16:00', sales: 160000, profit: 45000 },
  { time: '18:00', sales: 310000, profit: 98000 },
  { time: '20:00', sales: 280000, profit: 87000 },
];

// Dias da semana para o Selector de Calendário Superior
const DAYS = [
  { day: 'Qua', date: 24 },
  { day: 'Qui', date: 25 },
  { day: 'Sex', date: 26, hasDot: true },
  { day: 'Sáb', date: 27 },
  { day: 'Dom', date: 28, hasDot: true },
  { day: 'Seg', date: 29 },
  { day: 'Ter', date: 30 },
];

export const GoalsView: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState(27);
  const [timeFilter, setTimeFilter] = useState('1D');
  const [selectedAttendant, setSelectedAttendant] = useState('TODOS');
  const [goalTypeFilter, setGoalTypeFilter] = useState('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Valores da Meta Geral
  const currentBalance = 400000; // 400.000 Kz
  const targetGoal = 500000; // 500.000 Kz
  const toGoal = targetGoal - currentBalance;
  const percentage = Math.min(100, Math.round((currentBalance / targetGoal) * 100));

  // Cálculo SVG do Anel Circular de Progresso
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGoalCreated = (goal: NewGoalDTO) => {
    showToast(`Meta "${goal.title}" criada com sucesso.`);
  };

  return (
    <div id="view-goals" className="space-y-6 animate-in fade-in duration-200 text-[#131313]">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#131313] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3">
          <Check size={16} className="text-[#E1FB15]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. CABEÇALHO & SELECTOR DE CALENDÁRIO */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#131313] text-white">
            <Target size={22} className="text-[#E1FB15]" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-950">Metas</h1>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              Acompanhamento em tempo real do faturamento e rentabilidade da equipa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Componente de Dias da Semana */}
          <div className="flex items-center gap-1.5 bg-zinc-50 p-1.5 rounded-2xl border border-gray-100">
            {DAYS.map((item) => (
              <button
                key={item.date}
                type="button"
                onClick={() => setSelectedDay(item.date)}
                className={`flex flex-col items-center justify-center w-10 h-13 rounded-xl text-xs transition-all relative cursor-pointer ${
                  selectedDay === item.date
                    ? 'bg-[#131313] text-white font-bold ring-2 ring-[#E1FB15] scale-105'
                    : 'text-zinc-400 hover:text-zinc-800 hover:bg-white'
                }`}
              >
                <span className="text-[9px] font-medium uppercase opacity-70">{item.day}</span>
                <span className="text-sm font-extrabold mt-0.5">{item.date}</span>
                {item.hasDot && (
                  <span className="w-1 h-1 bg-rose-500 rounded-full absolute bottom-1.5" />
                )}
              </button>
            ))}
          </div>

          {/* Botão Nova Meta */}
          <button
            id="btn-new-goal"
            type="button"
            onClick={() => setIsModalOpen(true)}
            title="Criar Nova Meta"
            className="flex items-center gap-2 bg-[#131313] hover:bg-black text-white font-bold px-4 py-2.5 rounded-2xl shadow-xs transition text-xs cursor-pointer"
          >
            <Plus size={16} className="text-[#E1FB15]" />
            <span>Nova Meta</span>
          </button>
        </div>
      </div>

      {/* 2. HERO WIDGET — META GERAL DA LOJA (ANEL CIRCULAR DE PROGRESSO) */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-xs">
        <span className="bg-[#131313] text-white text-xs font-bold px-4 py-1.5 rounded-full mb-4">
          Meta Geral da Loja
        </span>

        {/* Anel SVG Dinâmico */}
        <div className="relative flex items-center justify-center my-2">
          <svg className="w-52 h-52 -rotate-90 transform">
            <circle
              cx="104"
              cy="104"
              r={radius}
              className="text-zinc-100 stroke-current"
              strokeWidth="12"
              fill="transparent"
            />
            <circle
              cx="104"
              cy="104"
              r={radius}
              className="text-emerald-500 stroke-current transition-all duration-1000 ease-out"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Conteúdo Central */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-black text-zinc-950 tracking-tight">
              {formatKz(currentBalance)}
            </span>
            <span className="text-[10px] text-zinc-400 font-medium uppercase mt-0.5">
              Faturamento Atual
            </span>

            <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col items-center">
              <span className="text-xs font-bold text-emerald-600">
                {formatKz(toGoal)}
              </span>
              <span className="text-[9px] text-zinc-400 uppercase tracking-wider">
                falta para a meta
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BARRA DE FILTROS & CARDS DE METRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Filtro: Atendente */}
        <div className="bg-white border border-gray-100 rounded-3xl p-4 flex flex-col justify-between shadow-xs">
          <span className="bg-zinc-100 text-zinc-700 text-[11px] font-bold px-3 py-1 rounded-lg w-fit mb-3">
            Atendente
          </span>
          <select
            value={selectedAttendant}
            onChange={(e) => setSelectedAttendant(e.target.value)}
            className="w-full bg-zinc-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 cursor-pointer"
          >
            <option value="TODOS">Todas as Atendentes</option>
            <option value="maria">Maria Silva</option>
            <option value="joao">João Pedro</option>
          </select>
        </div>

        {/* Filtro: Tipo de Meta */}
        <div className="bg-white border border-gray-100 rounded-3xl p-4 flex flex-col justify-between shadow-xs">
          <span className="bg-zinc-100 text-zinc-700 text-[11px] font-bold px-3 py-1 rounded-lg w-fit mb-3">
            Tipo de Meta
          </span>
          <select
            value={goalTypeFilter}
            onChange={(e) => setGoalTypeFilter(e.target.value)}
            className="w-full bg-zinc-50 border border-gray-200 rounded-xl p-2.5 text-xs font-medium text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 cursor-pointer"
          >
            <option value="TODOS">Faturamento & Lucro</option>
            <option value="SALES">Apenas Faturamento</option>
            <option value="PROFIT">Apenas Lucro</option>
          </select>
        </div>

        {/* Card: Total Faturado */}
        <div className="bg-white border border-gray-100 rounded-3xl p-4 flex flex-col items-center justify-between text-center shadow-xs">
          <span className="bg-zinc-100 text-zinc-700 text-[11px] font-bold px-3 py-1 rounded-lg w-fit mb-2">
            Total Faturado
          </span>
          <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-black text-lg my-1">
            {formatKz(3015000)}
          </div>
          <span className="text-[10px] text-zinc-400 font-medium">Acumulado do Período</span>
        </div>

        {/* Card: Lucro */}
        <div className="bg-white border border-gray-100 rounded-3xl p-4 flex flex-col items-center justify-between text-center shadow-xs">
          <span className="bg-zinc-100 text-zinc-700 text-[11px] font-bold px-3 py-1 rounded-lg w-fit mb-2">
            Lucro
          </span>
          <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-black text-lg my-1">
            {formatKz(1250000)}
          </div>
          <span className="text-[10px] text-zinc-400 font-medium">Margem Líquida Estimada</span>
        </div>
      </div>

      {/* 4. GRÁFICO DE DESEMPENHO */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col gap-4 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <span className="bg-zinc-100 text-zinc-700 text-xs font-bold px-3.5 py-1.5 rounded-lg inline-flex items-center gap-1.5">
            <TrendingUp size={14} />
            Gráfico do Desempenho
          </span>

          {/* Filtros de Período Temporais */}
          <div className="flex items-center gap-1.5 bg-zinc-50 p-1 rounded-xl border border-gray-100">
            {['1D', '1W', '1M', '1Y', 'ALL'].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setTimeFilter(filter)}
                className={`px-3 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                  timeFilter === filter
                    ? 'bg-[#131313] text-[#E1FB15] shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Área do Gráfico Recharts */}
        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={PERFORMANCE_DATA}>
              <defs>
                <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#131313',
                  borderColor: '#131313',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#fff',
                }}
                formatter={(value: number) => [formatKz(value), 'Faturamento']}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorGreen)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modal de Nova Meta */}
      {isModalOpen && (
        <CreateGoalModal
          attendants={[
            { id: 'maria', name: 'Maria Silva' },
            { id: 'joao', name: 'João Pedro' },
          ]}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleGoalCreated}
        />
      )}
    </div>
  );
};

export default GoalsView;
