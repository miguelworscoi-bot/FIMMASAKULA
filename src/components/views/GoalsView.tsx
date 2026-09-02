import React, { useState, useMemo, useEffect } from 'react';
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
  Calendar,
  User,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Info,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatKz } from '../../utils/formatters';
import { supabase } from '../../lib/supabase';
import { CreateGoalModal, NewGoalDTO } from '../admin/CreateGoalModal';
import { AttendanceStatsModule } from './AttendanceStatsView';
import { BrushStroke } from '../ui/BrushStroke';
import { useOperatorGoals, GoalItem } from '../../hooks/useOperatorGoals';

// Nomes em Português para datas
const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const FULL_MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export interface CalendarDayItem {
  id: string; // ISO date string YYYY-MM-DD
  dayLabel: string; // Seg, Ter, Qua...
  dayNumber: number; // 31, 1, 2...
  monthLabel: string; // Ago, Set...
  fullFormatted: string; // "31 de Agosto"
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  hasDot: boolean;
  diffDays: number; // 0 para hoje, negativo para passado, positivo para futuro
}

const ATTENDANTS = [
  { id: 'maria', name: 'Maria Silva' },
  { id: 'joao', name: 'João Pedro' },
  { id: 'ana', name: 'Ana Cardoso' },
];

const INITIAL_TEAM = [
  { id: 'maria', name: 'Maria Silva', role: 'Atendente Sénior', current: 320000, target: 350000 },
  { id: 'joao', name: 'João Pedro', role: 'Atendente', current: 210000, target: 300000 },
  { id: 'ana', name: 'Ana Cardoso', role: 'Atendente', current: 95000, target: 250000 },
];

const INITIAL_GOALS: GoalItem[] = [
  {
    id: 'goal-1',
    title: 'Meta Geral da Loja',
    type: 'BOTH',
    attendantId: 'TODOS',
    attendantName: 'Todas as Atendentes',
    targetAmount: 500000,
    currentAmount: 400000,
    dueDate: '2026-08-31',
    createdAt: '2026-08-01',
    notes: 'Objetivo de faturamento e rentabilidade diária da loja.',
  },
  {
    id: 'goal-2',
    title: 'Meta Individual - Maria Silva',
    type: 'SALES',
    attendantId: 'maria',
    attendantName: 'Maria Silva',
    targetAmount: 350000,
    currentAmount: 320000,
    dueDate: '2026-08-31',
    createdAt: '2026-08-01',
    notes: 'Vendas de balcão e produtos em destaque.',
  },
  {
    id: 'goal-3',
    title: 'Meta de Rentabilidade Semanal',
    type: 'PROFIT',
    attendantId: 'TODOS',
    attendantName: 'Todas as Atendentes',
    targetAmount: 1500000,
    currentAmount: 1250000,
    dueDate: '2026-09-05',
    createdAt: '2026-08-25',
    notes: 'Foco em margem de lucro nos serviços e acessórios.',
  },
  {
    id: 'goal-4',
    title: 'Meta de Atendimento - João Pedro',
    type: 'SALES',
    attendantId: 'joao',
    attendantName: 'João Pedro',
    targetAmount: 300000,
    currentAmount: 210000,
    dueDate: '2026-08-31',
    createdAt: '2026-08-01',
    notes: 'Atingimento mínimo de vendas no turno da tarde.',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

// Gerador dinâmico de dias do calendário sincronizado com a data actual
function getCalendarDays(offsetWeek: number = 0): CalendarDayItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: CalendarDayItem[] = [];
  const baseOffset = offsetWeek * 7;
  for (let i = -4; i <= 2; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + baseOffset + i);
    d.setHours(0, 0, 0, 0);

    const isToday = d.getTime() === today.getTime();
    const isPast = d.getTime() < today.getTime();
    const isFuture = d.getTime() > today.getTime();
    const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const id = `${year}-${month}-${day}`;

    days.push({
      id,
      dayLabel: WEEKDAY_NAMES[d.getDay()],
      dayNumber: d.getDate(),
      monthLabel: MONTH_NAMES[d.getMonth()],
      fullFormatted: `${d.getDate()} de ${FULL_MONTH_NAMES[d.getMonth()]}`,
      isToday,
      isPast,
      isFuture,
      hasDot: isToday || (isPast && diffDays >= -3),
      diffDays,
    });
  }

  return days;
}

interface GoalsViewProps {
  initialTab?: string;
}

export const GoalsView: React.FC<GoalsViewProps> = () => {
  const [weekOffset, setWeekOffset] = useState(0);

  // Lista dinâmica de dias do calendário
  const calendarDays = useMemo(() => getCalendarDays(weekOffset), [weekOffset]);

  // Dia de hoje por padrão
  const todayKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const [selectedDayKey, setSelectedDayKey] = useState<string>(todayKey);
  const [timeFilter, setTimeFilter] = useState('1D');
  const [selectedAttendant, setSelectedAttendant] = useState('TODOS');
  const [goalTypeFilter, setGoalTypeFilter] = useState('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hook de Metas Restrito ao Operador Logado
  const {
    goals,
    setGoals,
    isCloudSyncing,
    currentOperator,
    isRestrictedToSelf,
    operatorSalesTotal,
    refetchGoals,
  } = useOperatorGoals(selectedAttendant);

  const [selectedGoalId, setSelectedGoalId] = useState<string>('goal-1');
  const [goalsFilter, setGoalsFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

  useEffect(() => {
    if (goals.length > 0 && !goals.some((g) => g.id === selectedGoalId)) {
      setSelectedGoalId(goals[0].id);
    }
  }, [goals, selectedGoalId]);

  // Objeto do dia selecionado
  const selectedDayInfo = useMemo(() => {
    const found = calendarDays.find((d) => d.id === selectedDayKey);
    if (found) return found;

    const [year, month, day] = selectedDayKey.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setHours(0, 0, 0, 0);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const isToday = d.getTime() === now.getTime();
    const isPast = d.getTime() < now.getTime();
    const isFuture = d.getTime() > now.getTime();
    const diffDays = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      id: selectedDayKey,
      dayLabel: WEEKDAY_NAMES[d.getDay()],
      dayNumber: d.getDate(),
      monthLabel: MONTH_NAMES[d.getMonth()],
      fullFormatted: `${d.getDate()} de ${FULL_MONTH_NAMES[d.getMonth()]}`,
      isToday,
      isPast,
      isFuture,
      hasDot: isToday,
      diffDays,
    };
  }, [calendarDays, selectedDayKey]);

  // Meta ativa atualmente no Painel / Hero
  const activeGoal = useMemo(() => {
    return goals.find((g) => g.id === selectedGoalId) || goals[0] || INITIAL_GOALS[0];
  }, [goals, selectedGoalId]);

  // Cálculo de Métricas e Desempenho específico do dia selecionado
  const dayMetrics = useMemo(() => {
    // 1. DIA FUTURO: TUDO ZERADO
    if (selectedDayInfo.isFuture) {
      return {
        totalFaturado: 0,
        totalLucro: 0,
        margem: 0,
        highlightAttendant: {
          name: isRestrictedToSelf ? currentOperator.name : 'Nenhum registro',
          role: 'Data futura',
          note: 'Aguardando abertura de vendas deste dia',
          current: 0,
        },
        activeGoalBalance: 0,
        performanceData: [
          { time: '08:00', sales: 0, profit: 0 },
          { time: '10:00', sales: 0, profit: 0 },
          { time: '12:00', sales: 0, profit: 0 },
          { time: '14:00', sales: 0, profit: 0 },
          { time: '16:00', sales: 0, profit: 0 },
          { time: '18:00', sales: 0, profit: 0 },
          { time: '20:00', sales: 0, profit: 0 },
        ],
        teamRanking: isRestrictedToSelf
          ? [{ id: currentOperator.id, name: currentOperator.name, role: currentOperator.role, current: 0, target: activeGoal.targetAmount }]
          : [
              { id: 'maria', name: 'Maria Silva', role: 'Atendente Sénior', current: 0, target: 350000 },
              { id: 'joao', name: 'João Pedro', role: 'Atendente', current: 0, target: 300000 },
              { id: 'ana', name: 'Ana Cardoso', role: 'Atendente', current: 0, target: 250000 },
            ],
        isFutureDay: true,
        label: `Dia Futuro (${selectedDayInfo.fullFormatted})`,
      };
    }

    // 2. DIA DE HOJE: RESULTADOS REAIS E ATUAIS (COM DADOS DO OPERADOR SE RESTRITO)
    if (selectedDayInfo.isToday) {
      const selfSales = operatorSalesTotal > 0 ? operatorSalesTotal : activeGoal.currentAmount;
      const selfProfit = Math.round(selfSales * 0.4);
      const selfPct = activeGoal.targetAmount > 0 ? Math.round((selfSales / activeGoal.targetAmount) * 100) : 0;

      return {
        totalFaturado: isRestrictedToSelf ? selfSales : 3015000,
        totalLucro: isRestrictedToSelf ? selfProfit : 1250000,
        margem: 41,
        highlightAttendant: {
          name: isRestrictedToSelf ? currentOperator.name : 'Maria Silva',
          role: isRestrictedToSelf ? 'Meu Desempenho' : 'Atendente Sénior',
          note: `${selfPct}% da meta individual atingida hoje`,
          current: selfSales,
        },
        activeGoalBalance: selfSales,
        performanceData: isRestrictedToSelf
          ? [
              { time: '08:00', sales: Math.round(selfSales * 0.08), profit: Math.round(selfProfit * 0.08) },
              { time: '10:00', sales: Math.round(selfSales * 0.18), profit: Math.round(selfProfit * 0.18) },
              { time: '12:00', sales: Math.round(selfSales * 0.14), profit: Math.round(selfProfit * 0.14) },
              { time: '14:00', sales: Math.round(selfSales * 0.22), profit: Math.round(selfProfit * 0.22) },
              { time: '16:00', sales: Math.round(selfSales * 0.16), profit: Math.round(selfProfit * 0.16) },
              { time: '18:00', sales: Math.round(selfSales * 0.14), profit: Math.round(selfProfit * 0.14) },
              { time: '20:00', sales: Math.round(selfSales * 0.08), profit: Math.round(selfProfit * 0.08) },
            ]
          : [
              { time: '08:00', sales: 45000, profit: 12000 },
              { time: '10:00', sales: 120000, profit: 38000 },
              { time: '12:00', sales: 95000, profit: 29000 },
              { time: '14:00', sales: 210000, profit: 64000 },
              { time: '16:00', sales: 160000, profit: 45000 },
              { time: '18:00', sales: 310000, profit: 98000 },
              { time: '20:00', sales: 280000, profit: 87000 },
            ],
        teamRanking: isRestrictedToSelf
          ? [
              {
                id: currentOperator.id,
                name: `${currentOperator.name} (Você)`,
                role: currentOperator.role,
                current: selfSales,
                target: activeGoal.targetAmount,
              },
            ]
          : [
              { id: 'maria', name: 'Maria Silva', role: 'Atendente Sénior', current: 320000, target: 350000 },
              { id: 'joao', name: 'João Pedro', role: 'Atendente', current: 210000, target: 300000 },
              { id: 'ana', name: 'Ana Cardoso', role: 'Atendente', current: 95000, target: 250000 },
            ],
        isFutureDay: false,
        label: isRestrictedToSelf ? `Meu Desempenho de Hoje (${currentOperator.name})` : 'Resultados de Hoje em Tempo Real',
      };
    }

    // 3. DIAS ANTERIORES: RESULTADOS HISTÓRICOS ESPECÍFICOS DO DIA
    const absDiff = Math.abs(selectedDayInfo.diffDays);
    const historicSets = [
      { faturamento: 2840000, lucro: 1180000, top: 'João Pedro', topNote: '88% da meta atingida no dia', maria: 295000, joao: 264000, ana: 180000, ratio: 0.82 },
      { faturamento: 3450000, lucro: 1490000, top: 'Maria Silva', topNote: '102% da meta (Meta superada)', maria: 358000, joao: 280000, ana: 210000, ratio: 0.98 },
      { faturamento: 2190000, lucro: 920000, top: 'Ana Cardoso', topNote: '78% da meta individual', maria: 240000, joao: 190000, ana: 195000, ratio: 0.70 },
      { faturamento: 3100000, lucro: 1310000, top: 'Maria Silva', topNote: '94% da meta individual', maria: 330000, joao: 270000, ana: 175000, ratio: 0.88 },
      { faturamento: 2650000, lucro: 1090000, top: 'João Pedro', topNote: '82% da meta individual', maria: 280000, joao: 246000, ana: 160000, ratio: 0.76 },
      { faturamento: 3780000, lucro: 1620000, top: 'Maria Silva', topNote: '108% da meta (Melhor do dia)', maria: 380000, joao: 310000, ana: 235000, ratio: 1.04 },
      { faturamento: 1950000, lucro: 810000, top: 'Ana Cardoso', topNote: '71% da meta individual', maria: 210000, joao: 175000, ana: 178000, ratio: 0.62 },
    ];
    const dataSet = historicSets[(absDiff - 1) % historicSets.length];
    const margem = Math.round((dataSet.lucro / dataSet.faturamento) * 100);
    const pastGoalBalance = Math.round(activeGoal.targetAmount * dataSet.ratio);

    return {
      totalFaturado: isRestrictedToSelf ? pastGoalBalance : dataSet.faturamento,
      totalLucro: isRestrictedToSelf ? Math.round(pastGoalBalance * (margem / 100)) : dataSet.lucro,
      margem,
      highlightAttendant: {
        name: isRestrictedToSelf ? currentOperator.name : dataSet.top,
        role: isRestrictedToSelf ? 'Meu Registro' : 'Destaque do Dia',
        note: isRestrictedToSelf ? 'Desempenho apurado no dia' : dataSet.topNote,
        current: isRestrictedToSelf ? pastGoalBalance : (dataSet.top === 'Maria Silva' ? dataSet.maria : dataSet.top === 'João Pedro' ? dataSet.joao : dataSet.ana),
      },
      activeGoalBalance: pastGoalBalance,
      performanceData: [
        { time: '08:00', sales: Math.round(dataSet.faturamento * 0.05), profit: Math.round(dataSet.lucro * 0.05) },
        { time: '10:00', sales: Math.round(dataSet.faturamento * 0.15), profit: Math.round(dataSet.lucro * 0.15) },
        { time: '12:00', sales: Math.round(dataSet.faturamento * 0.12), profit: Math.round(dataSet.lucro * 0.12) },
        { time: '14:00', sales: Math.round(dataSet.faturamento * 0.23), profit: Math.round(dataSet.lucro * 0.23) },
        { time: '16:00', sales: Math.round(dataSet.faturamento * 0.18), profit: Math.round(dataSet.lucro * 0.18) },
        { time: '18:00', sales: Math.round(dataSet.faturamento * 0.19), profit: Math.round(dataSet.lucro * 0.19) },
        { time: '20:00', sales: Math.round(dataSet.faturamento * 0.08), profit: Math.round(dataSet.lucro * 0.08) },
      ],
      teamRanking: isRestrictedToSelf
        ? [
            {
              id: currentOperator.id,
              name: `${currentOperator.name} (Você)`,
              role: currentOperator.role,
              current: pastGoalBalance,
              target: activeGoal.targetAmount,
            },
          ]
        : [
            { id: 'maria', name: 'Maria Silva', role: 'Atendente Sénior', current: dataSet.maria, target: 350000 },
            { id: 'joao', name: 'João Pedro', role: 'Atendente', current: dataSet.joao, target: 300000 },
            { id: 'ana', name: 'Ana Cardoso', role: 'Atendente', current: dataSet.ana, target: 250000 },
          ],
      isFutureDay: false,
      label: isRestrictedToSelf ? `Meu Histórico de ${selectedDayInfo.fullFormatted}` : `Resultados Consolidados de ${selectedDayInfo.fullFormatted}`,
    };
  }, [selectedDayInfo, activeGoal, isRestrictedToSelf, currentOperator, operatorSalesTotal]);

  // Valores da Meta Selecionada
  const currentBalance = dayMetrics.activeGoalBalance;
  const targetGoal = activeGoal.targetAmount;
  const toGoal = Math.max(0, targetGoal - currentBalance);
  const percentage = Math.min(100, Math.round((currentBalance / targetGoal) * 100));

  // Cálculo SVG do Anel Circular de Progresso
  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const totalFaturado = dayMetrics.totalFaturado;
  const totalLucro = dayMetrics.totalLucro;
  const margem = dayMetrics.margem;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectDay = (day: CalendarDayItem) => {
    setSelectedDayKey(day.id);
    if (day.isFuture) {
      showToast(`Data futura selecionada (${day.fullFormatted}): Sem vendas registradas (Valores zerados).`);
    } else if (day.isToday) {
      showToast('Exibindo resultados em tempo real de hoje.');
    } else {
      showToast(`Exibindo dados consolidados de ${day.fullFormatted}.`);
    }
  };

  const handleGoToToday = () => {
    setWeekOffset(0);
    setSelectedDayKey(todayKey);
    showToast('Retornado para os dados de hoje.');
  };

  const handleGoalCreated = async (newGoalData: NewGoalDTO) => {
    const attendantObj = ATTENDANTS.find((a) => a.id === newGoalData.attendantId);
    const attendantName = newGoalData.attendantId === 'TODOS' 
      ? 'Todas as Atendentes' 
      : (attendantObj?.name || newGoalData.attendantId);

    const initialProgress = Math.round(newGoalData.targetAmount * 0.15);

    const newGoal: GoalItem = {
      id: `goal-${Date.now()}`,
      title: newGoalData.title,
      type: newGoalData.type,
      attendantId: isRestrictedToSelf ? currentOperator.id : newGoalData.attendantId,
      attendantName: isRestrictedToSelf ? currentOperator.name : attendantName,
      targetAmount: newGoalData.targetAmount,
      currentAmount: initialProgress,
      dueDate: newGoalData.dueDate,
      createdAt: new Date().toISOString().split('T')[0],
      notes: newGoalData.notes,
      operatorId: currentOperator.id,
    };

    setGoals((prev) => [newGoal, ...prev]);
    setSelectedGoalId(newGoal.id);
    showToast(`Meta "${newGoal.title}" criada e sincronizada com sucesso!`);

    try {
      await supabase.from('metas').insert([
        {
          title: newGoalData.title,
          target_amount: newGoalData.targetAmount,
          current_amount: initialProgress,
          period: 'monthly',
          attendant_id: isRestrictedToSelf ? currentOperator.id : newGoalData.attendantId,
          attendant_name: isRestrictedToSelf ? currentOperator.name : attendantName,
          operator_id: currentOperator.id,
          type: newGoalData.type,
          due_date: newGoalData.dueDate,
          notes: newGoalData.notes,
        },
      ]);
      refetchGoals();
    } catch (err) {
      console.warn('Persistência em background no Supabase:', err);
    }
  };

  const handleDeleteGoal = async (goalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (goals.length <= 1) {
      showToast('Deve existir pelo menos uma meta configurada.');
      return;
    }
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    if (selectedGoalId === goalId) {
      const remaining = goals.filter((g) => g.id !== goalId);
      if (remaining.length > 0) {
        setSelectedGoalId(remaining[0].id);
      }
    }
    showToast('Meta removida.');

    try {
      if (!goalId.startsWith('goal-')) {
        await supabase.from('metas').delete().eq('id', goalId);
      }
    } catch (err) {
      console.warn('Erro ao remover no Supabase:', err);
    }
  };

  const filteredGoals = useMemo(() => {
    if (goalsFilter === 'ALL') return goals;
    if (goalsFilter === 'COMPLETED') {
      return goals.filter((g) => g.currentAmount >= g.targetAmount);
    }
    return goals.filter((g) => g.currentAmount < g.targetAmount);
  }, [goals, goalsFilter]);

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
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-950 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 border border-zinc-800">
          <Check size={16} className="text-[#E1FB15]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOOLBAR — SELETOR DINÂMICO DE DIAS + SELETOR DE META ATIVA + NOVA META */}
      <motion.div
        variants={item}
        className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Target size={20} className="text-[#E1FB15]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black tracking-tight text-zinc-950">Metas de Desempenho</h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                selectedDayInfo.isFuture
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : selectedDayInfo.isToday
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-zinc-100 text-zinc-700 border-zinc-200'
              }`}>
                {selectedDayInfo.isFuture ? '📅 Dia Futuro (Zerado)' : selectedDayInfo.isToday ? '⚡ Hoje em Tempo Real' : `🗓️ ${selectedDayInfo.fullFormatted}`}
              </span>
              {isRestrictedToSelf ? (
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/30 flex items-center gap-1">
                  <UserCheck size={11} className="text-emerald-600" />
                  Sessão: {currentOperator.name} (Próprio Desempenho)
                </span>
              ) : (
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-zinc-900 text-white border border-zinc-800 flex items-center gap-1">
                  <ShieldCheck size={11} className="text-[#E1FB15]" />
                  Visão Gerencial (Equipa Completa)
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              {dayMetrics.label}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full xl:w-auto justify-start xl:justify-end">
          {/* Seletor rápido de meta ativa */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-gray-100 shadow-xs">
            <span className="text-[11px] font-bold text-zinc-400">Meta:</span>
            <select
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="bg-zinc-50 border border-gray-200 rounded-xl px-2.5 py-1 text-xs font-bold text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 cursor-pointer max-w-[170px] truncate"
            >
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          {/* Componente Dinâmico de Dias do Calendário Sincronizado com a Data Atual */}
          <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-xs">
            {/* Navegar para trás */}
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev - 1)}
              title="Semana anterior"
              className="w-7 h-12 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            {calendarDays.map((d) => {
              const isSelected = selectedDayKey === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleSelectDay(d)}
                  title={`${d.fullFormatted}${d.isToday ? ' (Hoje)' : d.isFuture ? ' (Futuro - Sem vendas)' : ' (Histórico)'}`}
                  className={`flex flex-col items-center justify-center w-10 sm:w-11 h-12 rounded-xl transition-all duration-300 relative cursor-pointer select-none active:scale-95 ${
                    isSelected
                      ? 'bg-zinc-950 text-white shadow-sm ring-2 ring-zinc-950/20 scale-105 z-10'
                      : d.isFuture
                      ? 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 border border-dashed border-zinc-200/80 hover:scale-105'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 hover:scale-105'
                  }`}
                >
                  <span className={`text-[9px] font-bold uppercase ${
                    isSelected ? 'opacity-80' : d.isToday ? 'text-emerald-600 font-black' : 'opacity-60'
                  }`}>
                    {d.isToday ? 'Hoje' : d.dayLabel}
                  </span>
                  <span className={`text-sm font-black mt-0.5 ${
                    isSelected ? 'text-white' : d.isToday ? 'text-emerald-700' : 'text-zinc-800'
                  }`}>
                    {d.dayNumber}
                  </span>

                  {/* Indicador de status do dia */}
                  {d.isToday ? (
                    <span
                      className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${
                        isSelected ? 'bg-[#E1FB15]' : 'bg-emerald-500'
                      }`}
                    />
                  ) : d.isFuture ? (
                    <span
                      className={`w-1 h-1 rounded-full absolute bottom-1.5 ${
                        isSelected ? 'bg-amber-300' : 'bg-zinc-300'
                      }`}
                    />
                  ) : d.hasDot ? (
                    <span
                      className={`w-1 h-1 rounded-full absolute bottom-1.5 ${
                        isSelected ? 'bg-[#E1FB15]' : 'bg-zinc-400'
                      }`}
                    />
                  ) : null}
                </button>
              );
            })}

            {/* Navegar para frente */}
            <button
              type="button"
              onClick={() => setWeekOffset((prev) => prev + 1)}
              title="Próxima semana"
              className="w-7 h-12 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>

            {/* Botão de reset para hoje se estiver fora de hoje */}
            {(!selectedDayInfo.isToday || weekOffset !== 0) && (
              <button
                type="button"
                onClick={handleGoToToday}
                title="Voltar para Hoje"
                className="ml-1 px-2.5 h-12 flex items-center gap-1 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-extrabold transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw size={12} />
                <span className="hidden sm:inline">Hoje</span>
              </button>
            )}
          </div>

          <button
            id="btn-new-goal"
            type="button"
            onClick={() => setIsModalOpen(true)}
            title="Criar Nova Meta"
            className="flex items-center gap-2 bg-zinc-950 hover:bg-black text-white font-bold px-4 py-3 rounded-2xl shadow-xs transition text-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <Plus size={16} className="text-[#E1FB15]" />
            <span>Nova Meta</span>
          </button>
        </div>
      </motion.div>

      {/* AVISO INFORMATIVO QUANDO DIA FUTURO FOR SELECIONADO */}
      {dayMetrics.isFutureDay && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2.5">
            <Info size={18} className="text-amber-600 shrink-0" />
            <div>
              <p className="font-black text-amber-950">Visualização de Data Futura: {selectedDayInfo.fullFormatted}</p>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Não há vendas registradas para esta data futura. Todos os indicadores, faturamentos e gráficos aparecem zerados até a chegada do dia e a realização de atendimentos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGoToToday}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs transition"
          >
            Ver Vendas de Hoje
          </button>
        </motion.div>
      )}

      {/* 2. HERO — PAINEL DE DESEMPENHO DA META SELECIONADA */}
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
                className={dayMetrics.isFutureDay ? "text-zinc-600 stroke-current" : "text-emerald-400 stroke-current"}
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
                {dayMetrics.isFutureDay ? 'sem progresso ainda' : 'da meta atingida'}
              </span>
            </div>
          </div>

          {/* Detalhes da Meta Ativa */}
          <div className="flex-1 w-full space-y-5 text-center lg:text-left">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-zinc-200 text-xs font-semibold backdrop-blur-md border border-white/10">
                <Flag size={12} className="text-[#E1FB15]" />
                <span>{activeGoal.title}</span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                {activeGoal.attendantName}
              </span>
              {percentage >= 100 && (
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500 text-white font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/30 animate-pulse">
                  <Trophy size={13} className="text-[#E1FB15]" />
                  <span>META BATIDA (100%)</span>
                </span>
              )}
              <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-medium">
                <Calendar size={12} /> Limite: {activeGoal.dueDate}
              </span>
            </div>

            <div>
              <div className="relative inline-block my-1.5 py-1">
                {/* Marca de Pincel atrás unida ao número */}
                <div className="absolute inset-0 -inset-x-8 -inset-y-3 -z-10 flex items-center justify-center pointer-events-none select-none">
                  <BrushStroke className="w-full h-full text-white/20 sm:text-white/25 drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] scale-110 sm:scale-125" />
                </div>

                {/* Número por cima em cor branca destacada */}
                <div className="relative z-10 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-md">
                  {formatKz(currentBalance)}
                </div>
              </div>
              <p className="text-zinc-400 text-sm mt-1">
                Objetivo definido: <span className="text-white font-semibold">{formatKz(targetGoal)}</span>
                {dayMetrics.isFutureDay ? (
                  <span className="text-amber-400 text-xs ml-2 font-bold">— Dia futuro selecionado (Zerado)</span>
                ) : activeGoal.notes ? (
                  <span className="text-zinc-500 text-xs ml-2 italic">— {activeGoal.notes}</span>
                ) : null}
              </p>
            </div>

            {/* Barra de progresso linear */}
            <div className="space-y-2 max-w-md mx-auto lg:mx-0">
              <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className={dayMetrics.isFutureDay ? "h-full rounded-full bg-zinc-700" : "h-full rounded-full bg-gradient-to-r from-emerald-400 to-[#E1FB15]"}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  {dayMetrics.isFutureDay ? (
                    <span className="text-zinc-400 font-medium">Nenhuma venda realizada neste dia</span>
                  ) : toGoal === 0 ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 size={13} /> Meta Concluída com Sucesso!
                    </span>
                  ) : (
                    <>Faltam <span className="text-[#E1FB15] font-bold">{formatKz(toGoal)}</span></>
                  )}
                </span>
                <span className="text-zinc-500 font-medium">{formatKz(targetGoal)}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. CARDS DE MÉTRICAS GERAIS */}
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
            <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold">
              {dayMetrics.isFutureDay ? (
                <span className="text-zinc-400">Sem vendas (Futuro)</span>
              ) : (
                <span className="text-emerald-600 flex items-center gap-1">
                  <ArrowUpRight size={14} />
                  <span>{selectedDayInfo.isToday ? 'Acumulado de hoje' : `Total de ${selectedDayInfo.fullFormatted}`}</span>
                </span>
              )}
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
              {dayMetrics.isFutureDay ? (
                <span>0% de margem</span>
              ) : (
                <span>Margem estimada de {margem}%</span>
              )}
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
            <div className="text-2xl font-black text-zinc-950 tracking-tight">
              {dayMetrics.highlightAttendant.name}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500 font-medium truncate">
              <span>{dayMetrics.highlightAttendant.note}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 4. GRELHA DE METAS CADASTRADAS */}
      <motion.div variants={item} className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-zinc-950 text-white flex items-center justify-center">
              <Sparkles size={18} className="text-[#E1FB15]" />
            </div>
            <div>
              <h2 className="font-bold text-base text-zinc-950">Metas Cadastradas & Desempenho</h2>
              <p className="text-xs text-zinc-400">Clique em qualquer meta para visualizar os detalhes no painel principal</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-xs">
              <button
                type="button"
                onClick={() => setGoalsFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  goalsFilter === 'ALL'
                    ? 'bg-zinc-950 text-white'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Todas ({goals.length})
              </button>
              <button
                type="button"
                onClick={() => setGoalsFilter('IN_PROGRESS')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  goalsFilter === 'IN_PROGRESS'
                    ? 'bg-zinc-950 text-white'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Em Andamento
              </button>
              <button
                type="button"
                onClick={() => setGoalsFilter('COMPLETED')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  goalsFilter === 'COMPLETED'
                    ? 'bg-zinc-950 text-white'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Concluídas
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredGoals.map((goal) => {
            const isSelected = goal.id === selectedGoalId;
            const displayAmount = dayMetrics.isFutureDay ? 0 : goal.currentAmount;
            const goalPct = Math.min(100, Math.round((displayAmount / goal.targetAmount) * 100));
            const isDone = displayAmount >= goal.targetAmount || goalPct >= 100;
            const remaining = Math.max(0, goal.targetAmount - displayAmount);
            const surplus = isDone ? Math.max(0, displayAmount - goal.targetAmount) : 0;

            return (
              <motion.div
                key={goal.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  setSelectedGoalId(goal.id);
                  showToast(`Exibindo "${goal.title}" no painel principal.`);
                }}
                className={`rounded-3xl p-5 border transition-all cursor-pointer relative group flex flex-col justify-between shadow-xs ${
                  isDone
                    ? isSelected
                      ? 'bg-gradient-to-b from-emerald-50/50 via-white to-white border-2 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-500/10'
                      : 'bg-gradient-to-b from-emerald-50/40 via-white to-white border-2 border-emerald-500/80 hover:border-emerald-500 hover:shadow-lg shadow-xs'
                    : isSelected
                    ? 'bg-white border-zinc-950 ring-2 ring-zinc-950/10 shadow-md'
                    : 'bg-white border-gray-100 hover:border-zinc-300 hover:shadow-lg'
                }`}
              >
                {/* SELO DE META BATIDA NO CANTO DO CARD */}
                {isDone && (
                  <div className="absolute -top-3 right-5 z-20 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm border border-emerald-400">
                    <Trophy size={11} className="text-[#E1FB15]" />
                    <span>Meta Batida</span>
                  </div>
                )}

                {/* TOOLTIP FLUTUANTE NO HOVER */}
                <div className="absolute -top-11 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 z-30 whitespace-nowrap bg-zinc-950 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-xl border border-zinc-800 flex items-center gap-2">
                  {dayMetrics.isFutureDay ? (
                    <>
                      <Clock size={11} className="text-amber-400" />
                      <span>Data Futura • Sem vendas</span>
                    </>
                  ) : isDone ? (
                    <>
                      <Trophy size={11} className="text-[#E1FB15]" />
                      <span className="text-[#32D583]">🏆 META BATIDA COM SUCESSO!</span>
                      <span className="text-zinc-500">•</span>
                      <span>Criada: {goal.createdAt || 'Recentemente'}</span>
                    </>
                  ) : (
                    <>
                      <Calendar size={11} className="text-[#E1FB15]" />
                      <span>Criada: {goal.createdAt || 'Recentemente'}</span>
                      <span className="text-zinc-500">•</span>
                      <span className="text-[#32D583]">Faltam {formatKz(remaining)}</span>
                    </>
                  )}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-950 rotate-45 border-r border-b border-zinc-800" />
                </div>

                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-xl uppercase tracking-wider bg-zinc-100 text-zinc-700">
                      {goal.type === 'SALES' ? 'Vendas' : goal.type === 'PROFIT' ? 'Lucro' : 'Geral'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteGoal(goal.id, e)}
                      title="Excluir meta"
                      className="text-zinc-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <h4 className="font-black text-sm text-zinc-950 tracking-tight leading-snug line-clamp-1">
                    {goal.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-1">
                    <User size={12} />
                    <span className="font-medium truncate">{goal.attendantName}</span>
                  </div>

                  <div className={`mt-4 space-y-1.5 p-3 rounded-2xl border ${
                    isDone ? 'bg-emerald-50/70 border-emerald-200/80' : 'bg-zinc-50/70 border-gray-100'
                  }`}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-bold text-zinc-950">{formatKz(displayAmount)}</span>
                      <span className={`text-[11px] font-black ${isDone ? 'text-emerald-700 font-extrabold' : 'text-emerald-600'}`}>{goalPct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-200/80 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${isDone ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-emerald-500 to-[#E1FB15]'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${goalPct}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
                      <span>Alvo: {formatKz(goal.targetAmount)}</span>
                      <span className="flex items-center gap-0.5 font-medium text-zinc-600">
                        <Clock size={10} /> Limite: {goal.dueDate}
                      </span>
                    </div>
                  </div>

                  {/* PAINEL EXPANSÍVEL NO HOVER */}
                  <div className="overflow-hidden max-h-0 group-hover:max-h-36 transition-all duration-300 ease-in-out opacity-0 group-hover:opacity-100">
                    <div className="mt-2 pt-2 border-t border-dashed border-gray-200 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 text-white">
                        <span className="text-zinc-400">{isDone ? 'Status da Meta:' : 'Restante para Meta:'}</span>
                        <span className="font-black text-[#E1FB15]">{isDone ? (surplus > 0 ? `Superada (+${formatKz(surplus)})` : 'Meta Atingida (100%)') : formatKz(remaining)}</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-500 px-1">
                        <span>Data de Criação:</span>
                        <span className="font-semibold text-zinc-700">{goal.createdAt || 'N/D'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-zinc-950 font-black' : 'text-zinc-400'}`}>
                    {isSelected ? '● Em foco no Painel' : 'Clique para focar'}
                  </span>
                  {dayMetrics.isFutureDay ? (
                    <span className="text-[10px] text-zinc-400 font-medium">Zerado (Futuro)</span>
                  ) : isDone ? (
                    <span className="text-[10px] font-extrabold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 size={12} className="text-emerald-600" /> Meta Batida
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-zinc-600">
                      Faltam <strong className="text-zinc-950">{formatKz(remaining)}</strong>
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
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
              <h3 className="font-bold text-base text-zinc-950">
                {isRestrictedToSelf ? 'Meu Desempenho no Turno' : 'Ranking de Vendas da Equipa'}
              </h3>
              <p className="text-xs text-zinc-400">
                {dayMetrics.isFutureDay
                  ? 'Sem vendas no dia futuro'
                  : isRestrictedToSelf
                  ? `Desempenho exclusivo de ${currentOperator.name}`
                  : 'Progresso individual de metas'}
              </p>
            </div>
            {isRestrictedToSelf ? (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl px-2.5 py-1 text-[11px] font-bold">
                {currentOperator.name}
              </div>
            ) : (
              <select
                value={selectedAttendant}
                onChange={(e) => setSelectedAttendant(e.target.value)}
                className="bg-zinc-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 cursor-pointer"
              >
                <option value="TODOS">Todos os Atendentes</option>
                {ATTENDANTS.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-4">
            {dayMetrics.teamRanking
              .filter((t) => selectedAttendant === 'TODOS' || t.id === selectedAttendant)
              .map((member, idx) => {
                const pct = Math.min(100, Math.round((member.current / member.target) * 100));
                return (
                  <div key={member.id} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                          pct > 0 && idx === 0
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
                        className={`h-full rounded-full ${idx === 0 && pct > 0 ? 'bg-emerald-500' : 'bg-zinc-800'}`}
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
              })}
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
                <p className="text-xs text-zinc-400">
                  {dayMetrics.isFutureDay ? `Dia futuro (${selectedDayInfo.fullFormatted}) • Sem vendas` : `Evolução em ${selectedDayInfo.fullFormatted}`}
                </p>
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

          <div className="h-72 w-full pt-2 relative">
            {dayMetrics.isFutureDay && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-2xl">
                <Clock size={28} className="text-zinc-400 mb-2" />
                <p className="text-xs font-bold text-zinc-800">Sem Vendas Registradas para Data Futura</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Os valores ficarão disponíveis à medida que os atendimentos forem realizados.</p>
              </div>
            )}

            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dayMetrics.performanceData} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
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

      {/* 6. MÓDULO DE TEMPO DE ATENDIMENTO & RENDIMENTO */}
      <motion.div variants={item} className="space-y-4 pt-2">
        <AttendanceStatsModule
          operatorId={currentOperator.id}
          isRestricted={isRestrictedToSelf}
        />
      </motion.div>

      {/* Modal de Nova Meta */}
      {isModalOpen && (
        <CreateGoalModal
          attendants={
            isRestrictedToSelf
              ? [{ id: currentOperator.id, name: currentOperator.name }]
              : ATTENDANTS
          }
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleGoalCreated}
        />
      )}
    </motion.div>
  );
};

export default GoalsView;
