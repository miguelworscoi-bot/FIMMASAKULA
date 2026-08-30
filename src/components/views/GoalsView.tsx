import React, { useState, useMemo } from 'react';
import {
  Plus,
  Target,
  TrendingUp,
  Check,
  Trophy,
  Wallet,
  Coins,
  ArrowUpRight,
  Flag,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatKz } from '../../utils/formatters';
import { CreateGoalModal, NewGoalDTO } from '../admin/CreateGoalModal';
import { TopProductsCarousel } from './TopProductsCarousel';

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

// Ranking de atendentes por progresso de meta (dados simulados)
const TEAM = [
  { id: 'maria', name: 'Maria Silva', role: 'Atendente Sénior', current: 320000, target: 350000 },
  { id: 'joao', name: 'João Pedro', role: 'Atendente', current: 210000, target: 300000 },
  { id: 'ana', name: 'Ana Cardoso', role: 'Atendente', current: 95000, target: 250000 },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

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
  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const totalFaturado = 3015000;
  const totalLucro = 1250000;
  const margem = useMemo(
    () => Math.round((totalLucro / totalFaturado) * 100),
    [totalFaturado, totalLucro],
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGoalCreated = (goal: NewGoalDTO) => {
    showToast(`Meta "${goal.title}" criada com sucesso.`);
  };

  return (
    <motion.div
      id="view-goals"
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 text-zinc-950"
    >
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-950 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3">
          <Check size={16} className="text-[#E1FB15]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOOLBAR — SELECTOR DE DIAS + NOVA META */}
      <motion.div
        variants={item}
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shrink-0">
            <Target size={20} className="text-[#E1FB15]" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-zinc-950">Metas de Desempenho</h1>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              Faturamento e rentabilidade da equipa em tempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Componente de Dias da Semana */}
          <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-xs">
            {DAYS.map((d) => (
              <button
                key={d.date}
                type="button"
                onClick={() => setSelectedDay(d.date)}
                className={`flex flex-col items-center justify-center w-10 h-12 rounded-xl transition-all relative cursor-pointer ${
                  selectedDay === d.date
                    ? 'bg-zinc-950 text-white'
                    : 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50'
                }`}
              >
                <span className="text-[9px] font-semibold uppercase opacity-70">{d.day}</span>
                <span className="text-sm font-extrabold mt-0.5">{d.date}</span>
                {d.hasDot && (
                  <span
                    className={`w-1 h-1 rounded-full absolute bottom-1.5 ${
                      selectedDay === d.date ? 'bg-[#E1FB15]' : 'bg-rose-500'
                    }`}
                  />
                )}
              </button>
            ))}
          </div>

          <button
            id="btn-new-goal"
            type="button"
            onClick={() => setIsModalOpen(true)}
            title="Criar Nova Meta"
            className="flex items-center gap-2 bg-zinc-950 hover:bg-black text-white font-bold px-4 py-3 rounded-2xl shadow-xs transition text-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={16} className="text-[#E1FB15]" />
            <span>Nova Meta</span>
          </button>
        </div>
      </motion.div>

      {/* 2. HERO — META GERAL DA LOJA (DARK BANNER + ANEL DE PROGRESSO) */}
      <motion.div
        variants={item}
        className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm"
      >
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-56 h-56 bg-[#E1FB15]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Anel SVG Dinâmico */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-52 h-52 -rotate-90 transform">
              <circle
                cx="104"
                cy="104"
                r={radius}
                className="text-white/10 stroke-current"
                strokeWidth="14"
                fill="transparent"
              />
              <motion.circle
                cx="104"
                cy="104"
                r={radius}
                className="text-emerald-400 stroke-current"
                strokeWidth="14"
                strokeDasharray={circumference}
                strokeLinecap="round"
                fill="transparent"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-black text-white tracking-tight">{percentage}%</span>
              <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mt-1">
                da meta atingida
              </span>
            </div>
          </div>

          {/* Detalhes da Meta */}
          <div className="flex-1 w-full space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-zinc-200 text-xs font-semibold backdrop-blur-md border border-white/10">
              <Flag size={12} className="text-[#E1FB15]" />
              Meta Geral da Loja • {DAYS.find((d) => d.date === selectedDay)?.day} {selectedDay}
            </div>

            <div>
              <div className="text-3xl sm:text-4xl font-black tracking-tight">
                {formatKz(currentBalance)}
              </div>
              <p className="text-zinc-400 text-sm mt-1">
                Objetivo do dia: <span className="text-white font-semibold">{formatKz(targetGoal)}</span>
              </p>
            </div>

            {/* Barra de progresso linear */}
            <div className="space-y-2 max-w-md mx-auto lg:mx-0">
              <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-[#E1FB15]"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Faltam <span className="text-[#E1FB15] font-bold">{formatKz(toGoal)}</span></span>
                <span className="text-zinc-500 font-medium">{formatKz(targetGoal)}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. CARDS DE MÉTRICAS */}
      <motion.div
        variants={item}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {/* Total Faturado */}
        <div className="p-5 rounded-3xl bg-white border border-gray-100/90 shadow-xs hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Faturado</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-zinc-950 tracking-tight">{formatKz(totalFaturado)}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 font-semibold">
              <ArrowUpRight size={14} />
              <span>Acumulado do período</span>
            </div>
          </div>
        </div>

        {/* Lucro */}
        <div className="p-5 rounded-3xl bg-white border border-gray-100/90 shadow-xs hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Lucro Líquido</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-zinc-950 tracking-tight">{formatKz(totalLucro)}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500 font-medium">
              <span>Margem estimada de {margem}%</span>
            </div>
          </div>
        </div>

        {/* Ticket / Melhor Atendente */}
        <div className="p-5 rounded-3xl bg-white border border-gray-100/90 shadow-xs hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Destaque do Dia</span>
            <div className="w-9 h-9 rounded-2xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <Trophy size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-zinc-950 tracking-tight">Maria Silva</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500 font-medium">
              <span>91% da meta individual</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 4. TOP PRODUTOS MAIS VENDIDOS (CARROSSEL 3D) */}
      <motion.div variants={item}>
        <TopProductsCarousel onAddToCart={() => showToast('Produto adicionado ao PDV.')} />
      </motion.div>

      {/* 5. GRELHA: RANKING DA EQUIPA + GRÁFICO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ranking da equipa */}
        <motion.div
          variants={item}
          className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-base text-zinc-950">Ranking da Equipa</h3>
              <p className="text-xs text-zinc-400">Progresso individual de metas</p>
            </div>
            <select
              value={selectedAttendant}
              onChange={(e) => setSelectedAttendant(e.target.value)}
              className="bg-zinc-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 cursor-pointer"
            >
              <option value="TODOS">Todos</option>
              {TEAM.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            {TEAM.filter((t) => selectedAttendant === 'TODOS' || t.id === selectedAttendant).map(
              (member, idx) => {
                const pct = Math.min(100, Math.round((member.current / member.target) * 100));
                return (
                  <div key={member.id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                          idx === 0
                            ? 'bg-[#E1FB15] text-zinc-950'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-zinc-900 truncate">{member.name}</span>
                          <span className="text-xs font-black text-zinc-950">{pct}%</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-medium">{member.role}</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${idx === 0 ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 + idx * 0.1 }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium pl-11">
                      <span>{formatKz(member.current)}</span>
                      <span>meta {formatKz(member.target)}</span>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </motion.div>

        {/* Gráfico de desempenho */}
        <motion.div
          variants={item}
          className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 flex flex-col gap-4 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp size={18} />
              </div>
              <div>
                <h3 className="font-bold text-base text-zinc-950">Curva de Faturamento</h3>
                <p className="text-xs text-zinc-400">Evolução ao longo do período</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={goalTypeFilter}
                onChange={(e) => setGoalTypeFilter(e.target.value)}
                className="bg-zinc-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 cursor-pointer"
              >
                <option value="TODOS">Faturamento & Lucro</option>
                <option value="SALES">Faturamento</option>
                <option value="PROFIT">Lucro</option>
              </select>
              <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-xl border border-gray-100">
                {['1D', '1W', '1M', '1Y', 'ALL'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setTimeFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                      timeFilter === f
                        ? 'bg-zinc-950 text-[#E1FB15]'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PERFORMANCE_DATA} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="time" stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#09090b',
                    borderColor: '#09090b',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                  labelStyle={{ color: '#a1a1aa' }}
                  formatter={(value: number, name: string) => [
                    formatKz(value),
                    name === 'sales' ? 'Faturamento' : 'Lucro',
                  ]}
                />
                {goalTypeFilter !== 'PROFIT' && (
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                )}
                {goalTypeFilter !== 'SALES' && (
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
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
    </motion.div>
  );
};

export default GoalsView;
