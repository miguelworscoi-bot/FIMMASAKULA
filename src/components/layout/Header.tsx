import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Plus, 
  ShoppingCart, 
  Wrench, 
  Package, 
  CircleDollarSign, 
  HelpCircle,
  Clock,
  Building2,
  CheckCircle2,
  AlertTriangle,
  BrainCircuit
} from 'lucide-react';
import { ActiveTab, NavigationTab } from '../../types';
import { formatKz } from '../../utils/formatters';
import { NotificationsCenter } from '../NotificationsCenter';

interface HeaderProps {
  activeTab: ActiveTab | NavigationTab;
  setActiveTab: (tab: any) => void;
  onOpenQuickSale?: () => void;
  onOpenQuickOS?: () => void;
  onOpenQuickProduct?: () => void;
  todaySalesTotal?: number;
  lowStockCount?: number;
  openOSCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickSale,
  onOpenQuickOS,
  onOpenQuickProduct,
  todaySalesTotal = 2586090,
  lowStockCount = 2,
  openOSCount = 3,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const getPageInfo = (tab: ActiveTab | NavigationTab) => {
    switch (tab) {
      case 'dashboard':
        return {
          title: 'Painel Geral',
          subtitle: 'Visão executiva e métricas em tempo real em Kwanzas (Kz)',
        };
      case 'sales':
      case 'pos':
        return {
          title: 'Vendas & PDV',
          subtitle: 'Faturação rápida de balcão, caixa e emissão de talões AGT',
        };
      case 'cash_session':
        return {
          title: 'Sessão & Controle de Caixa',
          subtitle: 'Abertura, sangrias, suprimentos de troco e fechamento com apuração de quebra/sobra',
        };
      case 'expenses':
        return {
          title: 'Gestão de Despesas',
          subtitle: 'Controle de saídas, fornecedores e contas a pagar em Kwanzas (Kz)',
        };
      case 'products':
        return {
          title: 'Gestão de Produtos',
          subtitle: 'Catálogo de artigos, controlo de inventário e margens de lucro',
        };
      case 'service_orders':
      case 'services':
        return {
          title: 'Ordens de Serviço',
          subtitle: 'Acompanhamento técnico de reparações, peças e orçamentos em Kz',
        };
      case 'customers':
        return {
          title: 'Clientes',
          subtitle: 'Cadastro de clientes, histórico e conformidade com NIF',
        };
      case 'reports':
        return {
          title: 'Relatórios',
          subtitle: 'Balanço financeiro, mapas de vendas e conformidade fiscal AGT',
        };
      case 'settings':
        return {
          title: 'Configurações',
          subtitle: 'Empresa, parâmetros AGT, moedas (Kz) e preferências do sistema',
        };
      case 'ai_engine':
        return {
          title: 'Masakula Intelligence',
          subtitle: 'Diagnóstico preditivo, curva de vendas e motor de IA',
        };
      default:
        return { title: 'Masakula ERP', subtitle: 'Gestão comercial em Kz' };
    }
  };

  const pageInfo = getPageInfo(activeTab);

  return (
    <header
      id="masakula-top-header"
      className="sticky top-0 z-30 bg-[#fcfcfc]/90 backdrop-blur-md border-b border-gray-100 px-6 py-3.5 transition-all"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Breadcrumb & Title */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
            <span className="hover:text-zinc-600 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              Masakula
            </span>
            <span>/</span>
            <span className="text-zinc-700 capitalize">{pageInfo.title}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <h1 className="text-xl font-bold text-zinc-950 tracking-tight">
              {pageInfo.title}
            </h1>
            {activeTab === 'pos' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Caixa Aberto
              </span>
            )}
          </div>
        </div>

        {/* Center/Right Actions & Search */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick Cash Summary Widget */}
          <div 
            onClick={() => setActiveTab('pos')}
            className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white border border-gray-200/80 shadow-xs cursor-pointer hover:border-zinc-400 transition-colors"
            title="Total faturado hoje no Caixa"
          >
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CircleDollarSign size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block leading-tight">
                Vendas Hoje
              </span>
              <span className="text-xs font-black text-zinc-900 leading-tight">
                {formatKz(todaySalesTotal)}
              </span>
            </div>
          </div>

          {/* Quick Actions Button Group */}
          <div className="flex items-center gap-1.5">
            {/* Ícone Disparador do Motor de IA */}
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'ai_engine' ? 'sales' : 'ai_engine')}
              title="Abrir Motor de IA e Previsão"
              className={`p-2.5 rounded-2xl transition-all border cursor-pointer ${
                activeTab === 'ai_engine'
                  ? 'bg-[#E1FB15] text-[#131313] border-[#E1FB15] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]'
                  : 'bg-[#131313] text-[#E1FB15] border-white/10 hover:border-[#E1FB15]/50 shadow-[4px_4px_10px_rgba(0,0,0,0.5)]'
              }`}
            >
              <BrainCircuit size={18} />
            </button>

            {activeTab !== 'pos' && activeTab !== 'sales' && (
              <button
                id="btn-quick-pos"
                type="button"
                onClick={() => {
                  setActiveTab('pos');
                  if (onOpenQuickSale) onOpenQuickSale();
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
              >
                <ShoppingCart size={15} className="text-emerald-400" />
                <span>Abrir PDV</span>
              </button>
            )}

            {activeTab !== 'services' && activeTab !== 'service_orders' && (
              <button
                id="btn-quick-os"
                type="button"
                onClick={() => {
                  setActiveTab('services');
                  if (onOpenQuickOS) onOpenQuickOS();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white hover:bg-zinc-50 border border-gray-200 text-zinc-800 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Wrench size={14} className="text-amber-500" />
                <span>Nova O.S.</span>
              </button>
            )}
          </div>

          {/* Real-time Notifications Center (Stock & Expiration) */}
          <NotificationsCenter onNavigateToProducts={() => setActiveTab('products')} />
        </div>
      </div>
    </header>
  );
};
