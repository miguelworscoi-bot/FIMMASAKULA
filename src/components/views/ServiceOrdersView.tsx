import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Printer, 
  X, 
  Cpu, 
  User, 
  Phone, 
  Calendar,
  DollarSign,
  Sparkles,
  ChevronRight,
  Filter,
  Check,
  RotateCcw,
  Wrench,
  FilterX
} from 'lucide-react';
import { WorkOrder, WorkOrderStatus, WorkOrderPriority } from '../../types';
import { formatKz, formatDate, formatDateTime, getPriorityConfig } from '../../utils/formatters';
import { supabaseService } from '../../services/supabaseService';

interface ServiceOrdersViewProps {
  workOrders: WorkOrder[];
  setWorkOrders: React.Dispatch<React.SetStateAction<WorkOrder[]>>;
}

export const ServiceOrdersView: React.FC<ServiceOrdersViewProps> = ({
  workOrders,
  setWorkOrders,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWOForDetails, setSelectedWOForDetails] = useState<WorkOrder | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for "Nova OS"
  const [formData, setFormData] = useState({
    code: '',
    customerName: '',
    customerPhone: '+244 9',
    equipment: '',
    serialNumber: '',
    reportedDefect: '',
    diagnosis: '',
    technician: 'Eng. Adilson Silva',
    priority: 'normal' as WorkOrderPriority,
    status: 'pending' as WorkOrderStatus,
    partsCost: '0',
    laborCost: '25000',
    estimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const generateOSCode = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `OS-2026-0${randomSuffix}`;
  };

  const handleOpenNewOSModal = () => {
    setFormData({
      code: generateOSCode(),
      customerName: '',
      customerPhone: '+244 9',
      equipment: '',
      serialNumber: '',
      reportedDefect: '',
      diagnosis: '',
      technician: 'Eng. Adilson Silva',
      priority: 'normal',
      status: 'pending',
      partsCost: '0',
      laborCost: '25000',
      estimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = parseFloat(formData.partsCost) || 0;
    const labor = parseFloat(formData.laborCost) || 0;

    const newWO: WorkOrder = {
      id: `wo-${Date.now()}`,
      code: formData.code || generateOSCode(),
      customerName: formData.customerName.trim(),
      customerPhone: formData.customerPhone.trim(),
      equipment: formData.equipment.trim(),
      serialNumber: formData.serialNumber.trim(),
      reportedDefect: formData.reportedDefect.trim(),
      diagnosis: formData.diagnosis.trim(),
      technician: formData.technician,
      priority: formData.priority,
      status: formData.status,
      partsCost: parts,
      laborCost: labor,
      totalCost: parts + labor,
      createdAt: new Date().toISOString(),
      estimatedDelivery: formData.estimatedDelivery,
    };

    setWorkOrders(prev => [newWO, ...prev]);
    setIsModalOpen(false);
    showToast(`Ordem de Serviço ${newWO.code} aberta com sucesso.`);

    // Asynchronously sync to Supabase
    supabaseService.insertServiceOrder(newWO).catch(err => console.warn('Supabase OS sync:', err));
  };

  const handleUpdateStatus = (id: string, newStatus: WorkOrderStatus) => {
    setWorkOrders(prev => prev.map(wo => wo.id === id ? { ...wo, status: newStatus } : wo));
    if (selectedWOForDetails && selectedWOForDetails.id === id) {
      setSelectedWOForDetails(prev => prev ? { ...prev, status: newStatus } : null);
    }
    showToast(`Estado da OS atualizado.`);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  // Helper for Status Badges with strict requested colors:
  // Concluído [verde], Em Andamento [amarelo], Pendente [vermelho]
  const renderStatusBadge = (status: WorkOrderStatus) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Concluído</span>
          </span>
        );
      case 'in_progress':
      case 'diagnosing':
      case 'waiting_parts':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Em Andamento</span>
          </span>
        );
      case 'pending':
      case 'canceled':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>Pendente</span>
          </span>
        );
    }
  };

  // Real-time filter
  const filteredOrders = workOrders.filter((wo) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      !term ||
      wo.code.toLowerCase().includes(term) ||
      wo.customerName.toLowerCase().includes(term) ||
      wo.equipment.toLowerCase().includes(term) ||
      wo.reportedDefect.toLowerCase().includes(term) ||
      wo.technician.toLowerCase().includes(term);

    let matchesStatus = true;
    if (statusFilter === 'completed') {
      matchesStatus = wo.status === 'completed' || wo.status === 'delivered';
    } else if (statusFilter === 'in_progress') {
      matchesStatus = wo.status === 'in_progress' || wo.status === 'diagnosing' || wo.status === 'waiting_parts';
    } else if (statusFilter === 'pending') {
      matchesStatus = wo.status === 'pending' || wo.status === 'canceled';
    }

    return matchesSearch && matchesStatus;
  });

  const totalParts = parseFloat(formData.partsCost) || 0;
  const totalLabor = parseFloat(formData.laborCost) || 0;
  const formTotalCost = totalParts + totalLabor;
  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all';
  const orderStats = [
    { label: 'Total de ordens', value: workOrders.length, tone: 'bg-zinc-950 text-white', icon: FileText },
    { label: 'Abertas', value: workOrders.filter((order) => order.status === 'pending').length, tone: 'bg-rose-50 text-rose-700', icon: AlertCircle },
    { label: 'Em andamento', value: workOrders.filter((order) => ['diagnosing', 'waiting_parts', 'in_progress'].includes(order.status)).length, tone: 'bg-amber-50 text-amber-700', icon: Clock },
    { label: 'Concluídas', value: workOrders.filter((order) => ['completed', 'delivered'].includes(order.status)).length, tone: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
    { label: 'Valor em carteira', value: formatKz(workOrders.reduce((total, order) => total + order.totalCost, 0)), tone: 'bg-[#E1FB15]/30 text-zinc-950', icon: DollarSign },
  ];

  return (
    <div id="view-work-orders" className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-950 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3">
          <Check size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* CABEÇALHO COM AÇÕES & BOTÃO DE NOVA OS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-zinc-950">Ordens de Serviço (OS)</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-700">
              {workOrders.length} ordens
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Gestão técnica de reparações, orçamentos, diagnósticos e valores em Kwanzas (Kz)
          </p>
        </div>

        {/* Botão de Abertura de Nova OS */}
        <button
          id="btn-add-work-order"
          type="button"
          onClick={handleOpenNewOSModal}
          className="px-4 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={16} className="text-amber-400" />
          <span>Nova Ordem de Serviço</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {orderStats.map(({ label, value, tone, icon: Icon }) => (
          <div key={label} className={`rounded-2xl border border-gray-100 p-4 shadow-xs transition-transform hover:-translate-y-0.5 ${tone}`}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider opacity-70">{label}</span>
              <Icon size={16} />
            </div>
            <p className="text-xl font-black tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      {/* FILTROS & BARRA DE PESQUISA REATIVA */}
      <div className="flex flex-col gap-3 rounded-3xl border border-gray-100 bg-zinc-50/70 p-3 shadow-xs md:flex-row md:items-center md:justify-between">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
          {[
            { id: 'all', label: 'Todas as OS' },
            { id: 'pending', label: 'Pendente' },
            { id: 'in_progress', label: 'Em Andamento' },
            { id: 'completed', label: 'Concluído' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search input and clear action */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              id="search-work-orders-input"
              type="text"
              placeholder="Pesquisar por nº OS, cliente, equipamento ou técnico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 shadow-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              title="Limpar todos os filtros"
              className="px-3 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <FilterX size={14} />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* TABELA DE LISTAGEM DE ORDENS DE SERVIÇO OU ESTADOS VAZIOS */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        {workOrders.length === 0 ? (
          /* Estado Vazio Total */
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-3xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
              <Wrench size={32} />
            </div>
            <h3 className="font-bold text-base text-zinc-900">Nenhuma Ordem de Serviço Registrada</h3>
            <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-5">
              Abra a primeira OS técnica para acompanhar manutenções, peças e valores em Kz.
            </p>
            <button
              type="button"
              onClick={handleOpenNewOSModal}
              className="px-5 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={16} className="text-amber-400" />
              <span>Abrir Primeira OS</span>
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Estado Sem Resultados de Pesquisa / Filtros */
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-50 border border-gray-100 flex items-center justify-center text-zinc-400 mb-3">
              <Search size={26} />
            </div>
            <h3 className="font-bold text-sm text-zinc-900">Nenhuma OS encontrada</h3>
            <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-4">
              Não encontramos nenhuma Ordem de Serviço com os critérios de busca selecionados.
            </p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Redefinir Filtros</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-gray-100 text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Código</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Descrição do Serviço</th>
                  <th className="py-3.5 px-4 text-center">Data</th>
                  <th className="py-3.5 px-4 text-right">Valor Total</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((wo) => {
                  const priorityConfig = getPriorityConfig(wo.priority);

                  return (
                    <tr key={wo.id} className="hover:bg-zinc-50/70 transition-colors group">
                      {/* COLUNA 1: Código OS */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-zinc-950 tracking-wide bg-zinc-100 px-2 py-1 rounded-lg">
                            {wo.code}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${priorityConfig.bg} ${priorityConfig.text}`}>
                            {priorityConfig.label}
                          </span>
                        </div>
                      </td>

                      {/* COLUNA 2: Cliente */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-900 text-xs">{wo.customerName}</div>
                        <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-0.5">
                          <Phone size={11} />
                          <span>{wo.customerPhone}</span>
                        </div>
                      </td>

                      {/* COLUNA 3: Equipamento / Serviço */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-zinc-900 text-xs truncate">
                          <Cpu size={13} className="text-zinc-400 shrink-0" />
                          <span className="truncate">{wo.equipment}</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5" title={wo.reportedDefect}>
                          {wo.reportedDefect}
                        </p>
                      </td>

                      {/* COLUNA 4: Data */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap text-[11px] text-zinc-500">
                        <div className="font-medium text-zinc-800">{formatDate(wo.createdAt)}</div>
                        <span className="text-[10px] text-zinc-400">Prev: {formatDate(wo.estimatedDelivery)}</span>
                      </td>

                      {/* COLUNA 5: Valor Total */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-black text-zinc-950 text-sm">
                          {formatKz(wo.totalCost)}
                        </div>
                        <span className="text-[10px] text-zinc-400 block">
                          Mão de obra: {formatKz(wo.laborCost)}
                        </span>
                      </td>

                      {/* COLUNA 6: Estado (Badges: Concluído [verde], Em Andamento [amarelo], Pendente [vermelho]) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {renderStatusBadge(wo.status)}
                      </td>

                      {/* COLUNA 7: Ações */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <select
                            value={wo.status}
                            onChange={(e) => handleUpdateStatus(wo.id, e.target.value as WorkOrderStatus)}
                            aria-label={`Alterar estado de ${wo.code}`}
                            className="px-2 py-1 rounded-xl bg-zinc-100 border border-gray-200 text-[11px] font-semibold text-zinc-700 focus:outline-none cursor-pointer"
                          >
                            <option value="pending">Pendente</option>
                            <option value="in_progress">Em Andamento</option>
                            <option value="completed">Concluído</option>
                            <option value="delivered">Entregue</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => setSelectedWOForDetails(wo)}
                            className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer"
                            title="Ver Ficha Técnica"
                          >
                            <FileText size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE DETALHES / FICHA TÉCNICA DA OS */}
      {selectedWOForDetails && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <span className="font-black text-base text-zinc-950 font-mono bg-zinc-100 px-2.5 py-1 rounded-xl">
                  {selectedWOForDetails.code}
                </span>
                {renderStatusBadge(selectedWOForDetails.status)}
              </div>
              <button
                type="button"
                onClick={() => setSelectedWOForDetails(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-zinc-50 p-3.5 rounded-2xl border border-gray-100">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Cliente & Contacto</span>
                <p className="font-bold text-zinc-900 text-sm">{selectedWOForDetails.customerName}</p>
                <p className="text-zinc-600 text-xs mt-0.5">{selectedWOForDetails.customerPhone}</p>
              </div>

              <div className="bg-zinc-50 p-3.5 rounded-2xl border border-gray-100 space-y-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Equipamento</span>
                <p className="font-bold text-zinc-900">{selectedWOForDetails.equipment}</p>
                {selectedWOForDetails.serialNumber && (
                  <p className="text-[11px] font-mono text-zinc-500">S/N: {selectedWOForDetails.serialNumber}</p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Defeito / Sintoma</span>
                <p className="text-zinc-700 bg-zinc-50 p-3 rounded-2xl border border-gray-100 leading-relaxed">
                  {selectedWOForDetails.reportedDefect}
                </p>
              </div>

              {selectedWOForDetails.diagnosis && (
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Diagnóstico & Parecer Técnico</span>
                  <p className="text-zinc-700 bg-zinc-50 p-3 rounded-2xl border border-gray-100 leading-relaxed">
                    {selectedWOForDetails.diagnosis}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-zinc-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Técnico</span>
                  <span className="font-semibold text-zinc-800">{selectedWOForDetails.technician}</span>
                </div>
                <div className="p-3 bg-zinc-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Entrega Estimada</span>
                  <span className="font-semibold text-zinc-800">{formatDate(selectedWOForDetails.estimatedDelivery)}</span>
                </div>
              </div>

              {/* Discriminação de Valores em Kwanzas (Kz) */}
              <div className="p-3.5 bg-zinc-950 text-white rounded-2xl space-y-1.5">
                <div className="flex justify-between text-zinc-400 text-xs">
                  <span>Custo Peças / Peças de Troca:</span>
                  <span>{formatKz(selectedWOForDetails.partsCost)}</span>
                </div>
                <div className="flex justify-between text-zinc-400 text-xs">
                  <span>Mão-de-Obra Técnica:</span>
                  <span>{formatKz(selectedWOForDetails.laborCost)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-emerald-400 pt-1.5 border-t border-zinc-800">
                  <span>Valor Total da OS:</span>
                  <span>{formatKz(selectedWOForDetails.totalCost)}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  alert(`Imprimindo Ficha de Entrada ${selectedWOForDetails.code} em Kwanzas (Kz)...`);
                }}
                className="px-3.5 py-2 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={14} />
                <span>Imprimir Talão</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedWOForDetails(null)}
                className="px-5 py-2 rounded-2xl bg-zinc-950 text-white font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ABERTURA DE NOVA OS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-zinc-950">Abertura de Nova Ordem de Serviço</h3>
                  <span className="font-mono text-xs font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-lg">
                    {formData.code}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">Registo de entrada de equipamento e orçamento técnico em Kwanzas (Kz)</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3.5 text-xs">
              {/* Cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Nome do Cliente</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Manuel Domingos..."
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Telefone</label>
                  <input
                    type="text"
                    required
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                  />
                </div>
              </div>

              {/* Equipamento & Número de Série */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Equipamento / Modelo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MacBook Pro M2, Impressora Epson..."
                    value={formData.equipment}
                    onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Nº de Série / IMEI (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: SN-2026-X892"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-mono focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                  />
                </div>
              </div>

              {/* Defeito e Sintoma */}
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">Defeito Reclamado / Serviço Solicitado</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Descreva o sintoma apresentado ou o serviço solicitado..."
                  value={formData.reportedDefect}
                  onChange={(e) => setFormData({ ...formData, reportedDefect: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                />
              </div>

              {/* Técnico & Previsão */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Técnico Responsável</label>
                  <select
                    value={formData.technician}
                    onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-medium focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                  >
                    <option value="Eng. Adilson Silva">Eng. Adilson Silva</option>
                    <option value="Técnico Bernardo Kiala">Técnico Bernardo Kiala</option>
                    <option value="Técnico Mateus Gomes">Técnico Mateus Gomes</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700">Previsão de Entrega</label>
                  <input
                    type="date"
                    required
                    value={formData.estimatedDelivery}
                    onChange={(e) => setFormData({ ...formData, estimatedDelivery: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                  />
                </div>
              </div>

              {/* Valores em Kz: Peças + Mão de Obra */}
              <div className="p-3 bg-zinc-50 rounded-2xl border border-gray-200 space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-zinc-700">Custo de Peças (Kz)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.partsCost}
                      onChange={(e) => setFormData({ ...formData, partsCost: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-zinc-900 focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-zinc-700">Mão-de-Obra (Kz)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.laborCost}
                      onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-zinc-900 focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-xs">
                  <span className="font-bold text-zinc-700">Valor Total Previsto:</span>
                  <span className="font-black text-base text-zinc-950">{formatKz(formTotalCost)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-gray-200 text-zinc-700 hover:bg-zinc-50 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Confirmar e Abrir OS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Export both names for modular compatibility
export { ServiceOrdersView as WorkOrdersView };
