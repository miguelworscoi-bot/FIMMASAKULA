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
  AlertTriangle
} from 'lucide-react';
import { ActiveTab, NavigationTab } from '../../types';
import { formatKz } from '../../utils/formatters';

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
  const [showNotifications, setShowNotifications] = useState(false);
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
            {activeTab !== 'pos' && (
              <button
                id="btn-quick-pos"
                type="button"
                onClick={() => {
                  setActiveTab('pos');
                  if (onOpenQuickSale) onOpenQuickSale();
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs hover:shadow transition-all"
              >
                <ShoppingCart size={15} className="text-emerald-400" />
                <span>Abrir PDV</span>
              </button>
            )}

            {activeTab !== 'services' && (
              <button
                id="btn-quick-os"
                type="button"
                onClick={() => {
                  setActiveTab('services');
                  if (onOpenQuickOS) onOpenQuickOS();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white hover:bg-zinc-50 border border-gray-200 text-zinc-800 text-xs font-semibold shadow-xs transition-colors"
              >
                <Wrench size={14} className="text-amber-500" />
                <span>Nova O.S.</span>
              </button>
            )}
          </div>

          {/* Notification Button */}
          <div className="relative">
            <button
              id="btn-notifications"
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Abrir notificações"
              className="w-9 h-9 rounded-2xl bg-white hover:bg-zinc-100 border border-gray-200 flex items-center justify-center text-zinc-600 transition-colors relative"
            >
              <Bell size={17} />
              {(lowStockCount > 0 || openOSCount > 0) && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                  {lowStockCount + openOSCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div 
                className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h4 className="font-bold text-sm text-zinc-900">Alertas do Sistema</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                    {lowStockCount + openOSCount} pendentes
                  </span>
                </div>

                <div className="py-2 space-y-2 text-xs">
                  {lowStockCount > 0 && (
                    <div 
                      onClick={() => {
                        setActiveTab('products');
                        setShowNotifications(false);
                      }}
                      className="p-2.5 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-2.5 cursor-pointer hover:bg-rose-100/70 transition-colors"
                    >
                      <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-rose-900">{lowStockCount} produtos com stock baixo</p>
                        <p className="text-[11px] text-rose-700">Artigos atingiram o ponto de reposição em armazém.</p>
                      </div>
                    </div>
                  )}

                  {openOSCount > 0 && (
                    <div 
                      onClick={() => {
                        setActiveTab('services');
                        setShowNotifications(false);
                      }}
                      className="p-2.5 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-2.5 cursor-pointer hover:bg-amber-100/70 transition-colors"
                    >
                      <Wrench size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-900">{openOSCount} Ordens de Serviço em aberto</p>
                        <p className="text-[11px] text-amber-700">Equipamentos aguardando diagnóstico ou reparo.</p>
                      </div>
                    </div>
                  )}

                  <div className="p-2.5 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-zinc-900">Certificado AGT Ativo</p>
                      <p className="text-[11px] text-zinc-500">Comunicação e assinatura digital em conformidade.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 text-center">
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-semibold text-zinc-500 hover:text-zinc-900"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
