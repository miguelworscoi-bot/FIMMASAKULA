import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface GoalItem {
  id: string;
  title: string;
  type: 'SALES' | 'PROFIT' | 'BOTH';
  attendantId: string;
  attendantName: string;
  targetAmount: number;
  currentAmount: number;
  dueDate: string;
  createdAt: string;
  notes?: string;
  operatorId?: string;
}

export interface OperatorSessionInfo {
  id: string;
  name: string;
  role: 'GERENTE' | 'CAIXA' | 'ADMIN' | 'OPERADOR_CAIXA' | string;
  isManagerOrAdmin: boolean;
}

export function getActiveSessionOperator(): OperatorSessionInfo {
  // 1. Verificar active_operator do PDV
  try {
    const raw = localStorage.getItem('active_operator');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.id) {
        const isMgr = parsed.role === 'GERENTE' || parsed.role === 'ADMIN';
        return {
          id: String(parsed.id),
          name: parsed.name || parsed.full_name || 'Operador Atual',
          role: parsed.role || 'CAIXA',
          isManagerOrAdmin: isMgr,
        };
      }
    }
  } catch (e) {
    console.warn('Erro ao ler active_operator:', e);
  }

  // 2. Verificar perfil salvo do Masakula Auth
  try {
    const rawProfile = localStorage.getItem('masakula_auth_profile_v1');
    if (rawProfile) {
      const p = JSON.parse(rawProfile);
      if (p?.id) {
        const isMgr = p.role === 'GERENTE' || p.role === 'ADMIN';
        return {
          id: String(p.id),
          name: p.full_name || 'Operador',
          role: p.role || 'CAIXA',
          isManagerOrAdmin: isMgr,
        };
      }
    }
  } catch (e) {
    console.warn('Erro ao ler masakula_auth_profile_v1:', e);
  }

  // Fallback padrão seguro (Maria Silva - Atendente)
  return {
    id: 'maria',
    name: 'Maria Silva',
    role: 'CAIXA',
    isManagerOrAdmin: false,
  };
}

export function useOperatorGoals(selectedAttendantFilter?: string) {
  const { profile } = useAuth();
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [operatorSalesTotal, setOperatorSalesTotal] = useState<number>(0);

  // Operador atual da sessão
  const currentOperator = useMemo<OperatorSessionInfo>(() => {
    if (profile?.id) {
      const isMgr = profile.role === 'GERENTE';
      return {
        id: profile.id,
        name: profile.full_name,
        role: profile.role,
        isManagerOrAdmin: isMgr,
      };
    }
    return getActiveSessionOperator();
  }, [profile]);

  const isRestrictedToSelf = !currentOperator.isManagerOrAdmin;

  // Carregar metas do Supabase aplicando a restrição do operador logado
  const fetchGoals = useCallback(async () => {
    try {
      setIsCloudSyncing(true);
      setLoading(true);

      let query = supabase.from('metas').select('*');

      // Se for atendente (não gerente/admin), filtra estritamente pelas suas próprias metas e metas globais (TODOS)
      if (isRestrictedToSelf) {
        query = query.or(`attendant_id.eq.${currentOperator.id},attendant_id.eq.TODOS,operator_id.eq.${currentOperator.id},attendant_name.ilike.%${currentOperator.name}%`);
      } else if (selectedAttendantFilter && selectedAttendantFilter !== 'TODOS') {
        // Se for gerente e escolheu filtrar por um atendente específico
        query = query.or(`attendant_id.eq.${selectedAttendantFilter},attendant_id.eq.TODOS`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped: GoalItem[] = data.map((item: any) => ({
          id: item.id ? String(item.id) : `goal-${Date.now()}`,
          title: item.title || 'Meta de Desempenho',
          type: (item.type || 'BOTH') as 'SALES' | 'PROFIT' | 'BOTH',
          attendantId: item.attendant_id || item.operator_id || 'TODOS',
          attendantName: item.attendant_name || (item.attendant_id === 'TODOS' ? 'Todas as Atendentes' : currentOperator.name),
          targetAmount: Number(item.target_amount) || 0,
          currentAmount: Number(item.current_amount) || 0,
          dueDate: item.due_date || new Date().toISOString().split('T')[0],
          createdAt: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          notes: item.notes || '',
          operatorId: item.operator_id || item.attendant_id,
        }));
        setGoals(mapped);
      } else {
        // Fallback local caso a tabela esteja vazia ou em mock
        const fallbackGoals: GoalItem[] = [
          {
            id: 'goal-1',
            title: 'Meta Geral da Loja',
            type: 'BOTH',
            attendantId: 'TODOS',
            attendantName: 'Todas as Atendentes',
            targetAmount: 500000,
            currentAmount: 400000,
            dueDate: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString().split('T')[0],
            notes: 'Objetivo de faturamento e rentabilidade diária da loja.',
          },
          {
            id: `goal-self-${currentOperator.id}`,
            title: `Meta Individual - ${currentOperator.name}`,
            type: 'SALES',
            attendantId: currentOperator.id,
            attendantName: currentOperator.name,
            targetAmount: 350000,
            currentAmount: 320000,
            dueDate: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString().split('T')[0],
            notes: 'Vendas acumuladas e atendimento ao cliente no caixa.',
          },
        ];
        setGoals(fallbackGoals);
      }

      // Buscar vendas reais do operador logado no dia de hoje para alimentar o progresso
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: salesData } = await supabase
          .from('sales')
          .select('total_amount, total')
          .eq('operator_id', currentOperator.id)
          .gte('created_at', todayStart.toISOString());

        if (salesData && salesData.length > 0) {
          const total = salesData.reduce((acc, curr) => {
            const val = Number(curr.total_amount) || parseFloat(String(curr.total || '').replace(/[^0-9.]/g, '')) || 0;
            return acc + val;
          }, 0);
          setOperatorSalesTotal(total);
        }
      } catch (salesErr) {
        console.warn('Erro ao obter vendas do operador para metas:', salesErr);
      }

    } catch (err) {
      console.warn('Erro ao carregar metas personalizadas:', err);
    } finally {
      setIsCloudSyncing(false);
      setLoading(false);
    }
  }, [currentOperator, isRestrictedToSelf, selectedAttendantFilter]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return {
    goals,
    setGoals,
    loading,
    isCloudSyncing,
    currentOperator,
    isRestrictedToSelf,
    operatorSalesTotal,
    refetchGoals: fetchGoals,
  };
}

export default useOperatorGoals;
