import React, { useState } from 'react';
import { ShieldCheck, UserCheck, KeyRound, AlertOctagon, History, Filter } from 'lucide-react';

export interface AuditLog {
  id: string;
  user_name: string;
  user_role: string;
  action_type: string;
  module: string;
  description: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

const MOCK_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    user_name: 'Carlos Silva',
    user_role: 'OPERADOR_CAIXA',
    action_type: 'ANULACAO_ITEM',
    module: 'PDV',
    description: 'Anulou 2x Cerveja Cuca 330ml da venda #1042',
    timestamp: 'Há 12 min',
    severity: 'WARNING',
  },
  {
    id: 'log-2',
    user_name: 'Miguel António',
    user_role: 'ADMIN',
    action_type: 'ALTERACAO_PRECO',
    module: 'ESTOQUE',
    description: 'Alterou o preço de custo do produto "Óleo de Palma 1L" de 1.000 Kz para 1.200 Kz',
    timestamp: 'Há 45 min',
    severity: 'INFO',
  },
  {
    id: 'log-3',
    user_name: 'Ana Sousa',
    user_role: 'OPERADOR_CAIXA',
    action_type: 'SANGRIA_CAIXA',
    module: 'CAIXA',
    description: 'Realizou sangria no valor de 25.000 Kz (Motivo: Pagamento a Fornecedor)',
    timestamp: 'Há 2 horas',
    severity: 'CRITICAL',
  },
];

export default function AuditAndSecurityScreen() {
  const [logs] = useState<AuditLog[]>(MOCK_LOGS);
  const [filterModule, setFilterModule] = useState<string>('ALL');

  const filteredLogs = filterModule === 'ALL'
    ? logs
    : logs.filter(log => log.module === filterModule);

  const getSeverityBadge = (severity: AuditLog['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2.5 py-1 bg-red-100 text-red-800 font-black text-[10px] rounded-lg">Crítico</span>;
      case 'WARNING':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-black text-[10px] rounded-lg">Atenção</span>;
      default:
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-black text-[10px] rounded-lg">Informativo</span>;
    }
  };

  return (
    <div className="w-full min-h-screen bg-white text-[#131313] p-6 md:p-8 space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
        <div className="p-3 bg-[#131313] text-[#E1FB15] rounded-2xl shadow-md">
          <ShieldCheck size={26} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#131313]">Governança & Trilha de Auditoria</h1>
          <p className="text-xs text-gray-500 font-medium">
            Rastreabilidade de operações sensíveis, controle de permissões e prevenção de fraudes
          </p>
        </div>
      </div>

      {/* Cards de Resumo da Segurança */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-[6px_6px_16px_rgba(0,0,0,0.03)] space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-gray-500">
            <span>Operadores Ativos</span>
            <UserCheck size={18} className="text-[#32D583]" />
          </div>
          <h3 className="text-2xl font-black text-[#131313]">3 Utilizadores</h3>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-[6px_6px_16px_rgba(0,0,0,0.03)] space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-gray-500">
            <span>Anulações Hoje</span>
            <AlertOctagon size={18} className="text-amber-500" />
          </div>
          <h3 className="text-2xl font-black text-[#131313]">2 Ocorrências</h3>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-[6px_6px_16px_rgba(0,0,0,0.03)] space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-gray-500">
            <span>Aprovações por PIN</span>
            <KeyRound size={18} className="text-[#131313]" />
          </div>
          <h3 className="text-2xl font-black text-[#131313]">5 Soluções</h3>
        </div>
      </div>

      {/* Tabela de Logs de Auditoria */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[6px_6px_18px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <History size={20} className="text-[#131313]" />
            <h2 className="text-sm font-black text-[#131313]">Histórico de Ações Rastreadas</h2>
          </div>

          {/* Filtros por Módulo */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            {['ALL', 'PDV', 'ESTOQUE', 'CAIXA'].map((mod) => (
              <button
                key={mod}
                type="button"
                onClick={() => setFilterModule(mod)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterModule === mod
                    ? 'bg-[#131313] text-[#E1FB15]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {mod === 'ALL' ? 'Todos' : mod}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-gray-400 font-bold border-b border-gray-100">
                <th className="pb-3">Data/Hora</th>
                <th className="pb-3">Utilizador / Função</th>
                <th className="pb-3">Ação</th>
                <th className="pb-3">Módulo</th>
                <th className="pb-3">Descrição Detalhada</th>
                <th className="pb-3 text-right">Nível</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition">
                  <td className="py-3.5 text-gray-500 font-mono text-[11px]">{log.timestamp}</td>
                  <td className="py-3.5">
                    <div className="font-bold text-[#131313]">{log.user_name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{log.user_role}</div>
                  </td>
                  <td className="py-3.5 font-bold text-gray-700">{log.action_type}</td>
                  <td className="py-3.5 font-bold text-gray-500">{log.module}</td>
                  <td className="py-3.5 text-gray-700 max-w-md">{log.description}</td>
                  <td className="py-3.5 text-right">{getSeverityBadge(log.severity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export { AuditAndSecurityScreen };
