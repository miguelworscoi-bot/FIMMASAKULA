import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Receipt,
  RotateCcw,
  Clock,
  User,
  Check,
  Coins,
  CreditCard,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Wallet
} from 'lucide-react';
import { CashSession, CashMovement } from '../../types';
import { formatKz, formatDate, formatTime } from '../../utils/formatters';
import { supabaseService } from '../../services/supabaseService';
import { supabase } from '../../lib/supabase';

interface CashSessionViewProps {
  activeSession: CashSession | null;
  setActiveSession: React.Dispatch<React.SetStateAction<CashSession | null>>;
  movements: CashMovement[];
  setMovements: React.Dispatch<React.SetStateAction<CashMovement[]>>;
}

export const CashSessionView: React.FC<CashSessionViewProps> = ({
  activeSession,
  setActiveSession,
  movements,
  setMovements
}) => {
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Formulário de Abertura
  const [initialAmountInput, setInitialAmountInput] = useState<number>(50000);
  const [operatorInput, setOperatorInput] = useState<string>('Operador Principal (Masakula)');

  // Fechamento & Conferência
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [actualCashInput, setActualCashInput] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState<string>('');

  // Movimentação Avulsa (Sangria / Suprimento)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<'SUPRIMENTO' | 'SANGRIA'>('SANGRIA');
  const [movementAmount, setMovementAmount] = useState<number>(5000);
  const [movementReason, setMovementReason] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const syncActiveSession = async () => {
    setLoading(true);
    try {
      const res = await supabaseService.getActiveCashSession();
      if (res.fromSupabase) {
        setActiveSession(res.data);
        if (res.data?.id) {
          const movs = await supabaseService.getCashMovements(res.data.id);
          if (movs.fromSupabase) {
            setMovements(movs.data);
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao sincronizar sessão de caixa:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeSession) {
      syncActiveSession();
    } else {
      setActualCashInput(activeSession.expected_cash || 0);
    }
  }, []);

  // 1. Abertura de Caixa
  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initialAmountInput < 0) {
      showToast('O fundo de caixa não pode ser negativo.');
      return;
    }

    setLoading(true);
    const newSession: CashSession = {
      id: `cs-${Date.now()}`,
      operator_name: operatorInput.trim() || 'Operador Balcão',
      initial_amount: Number(initialAmountInput),
      expected_cash: Number(initialAmountInput),
      status: 'OPEN',
      opened_at: new Date().toISOString(),
      actual_cash: null,
      difference: null,
      notes: null,
    };

    setActiveSession(newSession);
    setMovements([]);
    showToast(`Caixa aberto com fundo inicial de ${formatKz(newSession.initial_amount)}.`);

    try {
      const created = await supabaseService.openCashSession({
        operator_name: newSession.operator_name,
        initial_amount: newSession.initial_amount,
      });
      if (created && created.id) {
        setActiveSession(created);
      }
    } catch (err) {
      console.warn('Erro ao salvar no Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Lançar Sangria ou Suprimento
  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    if (movementAmount <= 0) {
      showToast('Por favor, informe um valor maior que zero.');
      return;
    }
    if (!movementReason.trim()) {
      showToast('Por favor, justifique o motivo da movimentação.');
      return;
    }

    // Validação de Sangria: não permitir sangria maior que o saldo esperado atual
    if (movementType === 'SANGRIA' && movementAmount > activeSession.expected_cash) {
      const confirmOverride = window.confirm(
        `Atenção: A sangria de ${formatKz(movementAmount)} é maior que o saldo esperado de ${formatKz(activeSession.expected_cash)}. Deseja continuar mesmo assim?`
      );
      if (!confirmOverride) return;
    }

    const adjustment = movementType === 'SUPRIMENTO' ? Number(movementAmount) : -Number(movementAmount);
    const newExpected = Math.max(0, Number(activeSession.expected_cash) + adjustment);

    const newMovement: CashMovement = {
      id: `mov-${Date.now()}`,
      session_id: activeSession.id,
      type: movementType,
      amount: Number(movementAmount),
      reason: movementReason.trim(),
      created_at: new Date().toISOString()
    };

    const updatedSession: CashSession = {
      ...activeSession,
      expected_cash: newExpected
    };

    setActiveSession(updatedSession);
    setMovements(prev => [newMovement, ...prev]);
    showToast(
      movementType === 'SUPRIMENTO' 
        ? `Suprimento de +${formatKz(movementAmount)} adicionado ao caixa.` 
        : `Sangria de -${formatKz(movementAmount)} registrada com sucesso.`
    );

    setIsMovementModalOpen(false);
    setMovementAmount(5000);
    setMovementReason('');

    // Sincronização assíncrona
    supabaseService.insertCashMovement(newMovement).catch(err => console.warn(err));
    supabaseService.updateCashSessionExpected(activeSession.id, newExpected).catch(err => console.warn(err));
  };

  // 3. Fechamento de Caixa & Apuração de Quebra / Sobra
  const handleCloseSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;

    const counted = Number(actualCashInput) || 0;
    const expected = Number(activeSession.expected_cash) || 0;
    const diff = counted - expected; // Positivo = Sobra, Negativo = Quebra, Zero = Exato

    const closedSession: CashSession = {
      ...activeSession,
      actual_cash: counted,
      difference: diff,
      status: 'CLOSED',
      closed_at: new Date().toISOString(),
      notes: closingNotes || null
    };

    setActiveSession(null);
    setMovements([]);
    setIsClosingModalOpen(false);

    let statusText = 'Caixa balanceado exato!';
    if (diff > 0) statusText = `Fechamento concluído com SOBRA de +${formatKz(diff)}.`;
    if (diff < 0) statusText = `Fechamento concluído com QUEBRA de -${formatKz(Math.abs(diff))}.`;
    showToast(statusText);

    supabaseService.closeCashSession(activeSession.id, counted, diff).catch(err => console.warn(err));
  };

  // Totais de movimentações
  const totalSuprimentos = movements
    .filter(m => m.type === 'SUPRIMENTO')
    .reduce((acc, m) => acc + Number(m.amount), 0);

  const totalSangrias = movements
    .filter(m => m.type === 'SANGRIA')
    .reduce((acc, m) => acc + Number(m.amount), 0);
  const cashStats = [
    { label: 'Saldo inicial', value: formatKz(activeSession?.initial_amount || 0), icon: Coins, tone: 'text-zinc-950' },
    { label: 'Entradas', value: `+${formatKz(totalSuprimentos)}`, icon: ArrowUpRight, tone: 'text-emerald-600' },
    { label: 'Saídas', value: `-${formatKz(totalSangrias)}`, icon: ArrowDownLeft, tone: 'text-rose-600' },
    { label: 'Saldo atual', value: formatKz(activeSession?.expected_cash || 0), icon: Wallet, tone: 'text-[#131313]' },
  ];

  return (
    <div id="view-cash-session" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 text-[#131313]">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#131313] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3">
          <Check size={16} className="text-[#E1FB15]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ==========================================
          ESTADO 1: CAIXA FECHADO (Formulário de Abertura)
          ========================================== */}
      {!activeSession ? (
        <div className="max-w-md mx-auto my-10 p-6 sm:p-8 bg-white border border-gray-100 rounded-3xl shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-[#131313] text-[#E1FB15] rounded-3xl flex items-center justify-center mx-auto shadow-md">
              <Lock size={30} />
            </div>
            <h2 className="text-xl font-black text-zinc-950">Caixa Fechado</h2>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
              Inicie uma nova sessão de PDV informando o operador e o fundo de caixa de reserva em Kwanzas (Kz).
            </p>
          </div>

          <form onSubmit={handleOpenSession} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-zinc-700 block mb-1.5 flex items-center gap-1.5">
                <User size={14} className="text-zinc-400" />
                Nome do Operador de Caixa *
              </label>
              <input
                id="input-operator-name"
                type="text"
                required
                value={operatorInput}
                onChange={(e) => setOperatorInput(e.target.value)}
                placeholder="Ex: Operador Principal / Caixa 01"
                className="w-full p-3 bg-zinc-50 border border-gray-200 rounded-2xl font-bold text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 transition-all"
              />
            </div>

            <div>
              <label className="font-bold text-zinc-700 block mb-1.5 flex items-center gap-1.5">
                <Coins size={14} className="text-zinc-400" />
                Fundo de Caixa Inicial (Kz) *
              </label>
              <input
                id="input-initial-amount"
                type="number"
                required
                min="0"
                step="100"
                value={initialAmountInput || ''}
                onChange={(e) => setInitialAmountInput(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 50.000 Kz"
                className="w-full p-3 bg-zinc-50 border border-gray-200 rounded-2xl text-base font-black text-zinc-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 transition-all"
              />
              <p className="text-[11px] text-zinc-400 mt-1 font-medium">
                Valor físico em dinheiro vivo deixado na gaveta para troco.
              </p>
            </div>

            <div className="pt-2">
              <button
                id="btn-open-cash-session"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#131313] hover:bg-black text-[#E1FB15] font-black rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer active:scale-[0.99]"
              >
                <Unlock size={16} />
                <span>{loading ? 'A abrir caixa...' : 'Abrir Sessão de Caixa'}</span>
              </button>
            </div>
          </form>

          <div className="border-t border-gray-100 pt-4 text-center">
            <span className="text-[11px] text-zinc-400 font-medium">
              Ecossistema Masakula • Faturação e Vendas em conformidade AGT
            </span>
          </div>
        </div>
      ) : (
        /* ==========================================
           ESTADO 2: CAIXA ABERTO (Painel Operacional)
           ========================================== */
        <div className="space-y-6">
          {/* Cabeçalho de Status do Caixa */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                <Unlock size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase text-emerald-700 tracking-wider bg-emerald-100/70 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Caixa Aberto
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">
                    Operador: <strong className="text-zinc-800">{activeSession.operator_name}</strong>
                  </span>
                </div>
                <h1 className="text-lg font-bold text-zinc-950 mt-1">
                  Sessão iniciada às {formatTime(activeSession.opened_at)} ({formatDate(activeSession.opened_at)})
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <button
                id="btn-trigger-movement"
                type="button"
                onClick={() => setIsMovementModalOpen(true)}
                className="flex-1 md:flex-none px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold rounded-2xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus size={15} />
                <span>Sangria / Suprimento</span>
              </button>
              <button
                id="btn-trigger-close"
                type="button"
                onClick={() => {
                  setActualCashInput(activeSession.expected_cash || 0);
                  setIsClosingModalOpen(true);
                }}
                className="flex-1 md:flex-none px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Lock size={15} />
                <span>Fechar Caixa</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {cashStats.map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs transition-transform hover:-translate-y-0.5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{label}</span>
                  <Icon size={16} className={tone} />
                </div>
                <p className={`text-lg font-black ${tone}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Cards de Balanço do Caixa em Tempo Real */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Fundo Inicial</p>
              <p className="text-xl font-black text-zinc-950 mt-1">
                {formatKz(activeSession.initial_amount)}
              </p>
              <p className="text-[10px] text-zinc-400 font-medium mt-1">Abertura de gaveta</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
              <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">+ Suprimentos</p>
              <p className="text-xl font-black text-emerald-600 mt-1">
                +{formatKz(totalSuprimentos)}
              </p>
              <p className="text-[10px] text-zinc-400 font-medium mt-1">Entradas de reforço</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
              <p className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider">- Sangrias</p>
              <p className="text-xl font-black text-rose-500 mt-1">
                -{formatKz(totalSangrias)}
              </p>
              <p className="text-[10px] text-zinc-400 font-medium mt-1">Retiradas de caixa</p>
            </div>

            <div className="bg-[#131313] text-white p-5 rounded-3xl shadow-md border border-zinc-800">
              <p className="text-[11px] font-bold text-[#E1FB15] uppercase tracking-wider">Saldo Esperado em Gaveta</p>
              <p className="text-2xl font-black text-white mt-1 tracking-tight">
                {formatKz(activeSession.expected_cash)}
              </p>
              <p className="text-[10px] text-zinc-400 font-medium mt-1">Fundo + Suprimentos - Sangrias</p>
            </div>
          </div>

          {/* Tabela de Movimentações Avulsas */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-zinc-950">Movimentações Avulsas da Sessão</h3>
                <p className="text-xs text-zinc-400 font-medium">Histórico de saídas (sangrias) e entradas de reforço (suprimentos)</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-700">
                {movements.length} registro(s)
              </span>
            </div>

            {movements.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 text-xs font-medium border-2 border-dashed border-zinc-100 rounded-2xl">
                <Receipt className="mx-auto mb-2 text-zinc-300" size={32} />
                <p>Nenhuma sangria ou suprimento registrado nesta sessão.</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Use o botão "Sangria / Suprimento" para lançar entradas ou saídas de troco.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {movements.map((m) => {
                  const isSuprimento = m.type === 'SUPRIMENTO';
                  return (
                    <div key={m.id || Math.random().toString()} className="py-3 flex items-center justify-between text-xs hover:bg-zinc-50/50 rounded-xl px-2 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isSuprimento ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {isSuprimento ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              isSuprimento ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {m.type}
                            </span>
                            <span className="font-bold text-zinc-950">{m.reason}</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                            {formatDate(m.created_at || '')} às {formatTime(m.created_at || '')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-black text-sm ${isSuprimento ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isSuprimento ? '+' : '-'} {formatKz(m.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: SANGRIA / SUPRIMENTO
          ========================================== */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-zinc-950">Registrar Movimentação de Gaveta</h3>
              <button 
                type="button" 
                onClick={() => setIsMovementModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMovement} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1.5">Tipo de Movimento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementType('SANGRIA')}
                    className={`py-2.5 rounded-xl font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      movementType === 'SANGRIA' 
                        ? 'bg-rose-600 text-white shadow-xs' 
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    <ArrowUpRight size={15} />
                    <span>Sangria (Retirada)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('SUPRIMENTO')}
                    className={`py-2.5 rounded-xl font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      movementType === 'SUPRIMENTO' 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    <ArrowDownLeft size={15} />
                    <span>Suprimento (Entrada)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Valor em Kwanzas (Kz) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="50"
                  value={movementAmount || ''}
                  onChange={(e) => setMovementAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-zinc-50 border border-gray-200 rounded-xl font-black text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Motivo / Justificativa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pagamento a entregador / Troco suplementar"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#131313] hover:bg-black text-white rounded-xl font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} className="text-[#E1FB15]" />
                  <span>Confirmar Movimento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: FECHAMENTO DE CAIXA & CONFERÊNCIA
          ========================================== */}
      {isClosingModalOpen && activeSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <Lock size={18} />
                </div>
                <h3 className="font-bold text-base text-zinc-950">Fechamento de Caixa & Conferência</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsClosingModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCloseSession} className="space-y-4 text-xs">
              <div className="bg-zinc-50 p-4 rounded-2xl space-y-2 border border-gray-100">
                <div className="flex justify-between font-medium text-zinc-500">
                  <span>Fundo Inicial:</span>
                  <span className="font-bold text-zinc-800">{formatKz(activeSession.initial_amount)}</span>
                </div>
                <div className="flex justify-between font-medium text-zinc-500">
                  <span>Total Suprimentos:</span>
                  <span className="font-bold text-emerald-600">+{formatKz(totalSuprimentos)}</span>
                </div>
                <div className="flex justify-between font-medium text-zinc-500">
                  <span>Total Sangrias:</span>
                  <span className="font-bold text-rose-600">-{formatKz(totalSangrias)}</span>
                </div>
                <div className="flex justify-between font-bold text-zinc-700 pt-1 border-t border-gray-200">
                  <span>Saldo Esperado em Gaveta:</span>
                  <span className="font-black text-zinc-950 text-sm">{formatKz(activeSession.expected_cash)}</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">
                  Valor Fisicamente Contado em Dinheiro (Kz) *
                </label>
                <input
                  type="number"
                  required
                  step="50"
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(parseFloat(e.target.value) || 0)}
                  placeholder="0,00 Kz"
                  className="w-full p-3 bg-zinc-50 border border-gray-200 rounded-2xl text-base font-black text-zinc-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                />
              </div>

              {/* Cálculo dinâmico de diferença: Sobra / Quebra / Exato */}
              {(() => {
                const diff = actualCashInput - activeSession.expected_cash;
                if (diff === 0) {
                  return (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl font-bold flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                      <span>Caixa exato! Sem diferenças apuradas entre a contagem física e o sistema.</span>
                    </div>
                  );
                } else if (diff < 0) {
                  return (
                    <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl font-bold flex items-center gap-2">
                      <AlertTriangle size={18} className="text-rose-600 shrink-0" />
                      <span>Quebra de Caixa: Faltam {formatKz(Math.abs(diff))} na gaveta.</span>
                    </div>
                  );
                } else {
                  return (
                    <div className="p-3.5 bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl font-bold flex items-center gap-2">
                      <AlertCircle size={18} className="text-amber-600 shrink-0" />
                      <span>Sobra de Caixa: Excedente de +{formatKz(diff)} na gaveta.</span>
                    </div>
                  );
                }
              })()}

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Observações de Encerramento (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Comentários sobre a sessão ou motivos de divergência..."
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-gray-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsClosingModalOpen(false)}
                  className="px-4 py-2.5 border border-gray-200 rounded-2xl font-bold text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Lock size={15} />
                  <span>Encerrar Sessão</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default CashSessionView;
