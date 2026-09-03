import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Wrench, 
  ShoppingCart, 
  Coins, 
  TrendingDown, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Sparkles, 
  BrainCircuit,
  Target,
  Clock
} from 'lucide-react';
import { ActiveTab, NavigationTab, UserSession } from '../../types';

export interface SidebarNavOption {
  id: ActiveTab;
  label: string;
  tooltip: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  badge?: string | number;
  badgeColor?: string;
  isBottom?: boolean;
}

export const MAIN_NAV_ITEMS: SidebarNavOption[] = [
  {
    id: 'dashboard',
    label: 'Painel Geral',
    tooltip: 'Painel Geral & Indicadores',
    icon: LayoutDashboard,
  },
  {
    id: 'products',
    label: 'Gestão de Produtos',
    tooltip: 'Gestão de Produtos & Stock (Kz)',
    icon: Package,
  },
  {
    id: 'service_orders',
    label: 'Ordens de Serviço',
    tooltip: 'Ordens de Serviço (OS)',
    icon: Wrench,
  },
  {
    id: 'sales',
    label: 'Vendas & PDV',
    tooltip: 'Vendas & Frente de Caixa PDV',
    icon: ShoppingCart,
  },
  {
    id: 'cash_session',
    label: 'Sessão de Caixa',
    tooltip: 'Abertura, Sangrias, Suprimentos & Fechamento',
    icon: Coins,
  },
  {
    id: 'expenses',
    label: 'Despesas',
    tooltip: 'Despesas & Contas a Pagar (Kz)',
    icon: TrendingDown,
  },
  {
    id: 'customers',
    label: 'Clientes',
    tooltip: 'Clientes & Gestão de NIF',
    icon: Users,
  },
  {
    id: 'goals',
    label: 'Metas',
    tooltip: 'Metas de Faturamento, Lucro & Tempo de Atendimento',
    icon: Target,
  },
  {
    id: 'reports',
    label: 'Relatórios',
    tooltip: 'Relatórios & Mapas Fiscais AGT',
    icon: BarChart3,
  },
  {
    id: 'ai_engine',
    label: 'Masakula AI',
    tooltip: 'Diagnóstico Preditivo & Inteligência Artificial',
    icon: BrainCircuit,
    badge: 'AI',
    badgeColor: 'bg-[#E1FB15] text-[#131313]',
  },
];

export const SETTINGS_ITEM: SidebarNavOption = {
  id: 'settings',
  label: 'Configurações',
  tooltip: 'Configurações do Sistema & Empresa',
  icon: Settings,
  isBottom: true,
};

interface SidebarProps {
  activeTab: ActiveTab | NavigationTab;
  setActiveTab: (tab: any) => void;
  pendingOrdersCount?: number;
  lowStockCount?: number;
  userSession?: UserSession;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingOrdersCount = 0,
  lowStockCount = 0,
  userSession,
  onLogout,
}) => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  // Normalize legacy tab names if passed
  const currentActiveTab: ActiveTab = 
    activeTab === 'services' ? 'service_orders' : 
    activeTab === 'pos' ? 'sales' : 
    (activeTab as ActiveTab);

  return (
    <aside
      id="masakula-sidebar"
      className="fixed top-0 left-0 h-screen w-16 z-40 bg-[var(--color-surface)] border-r border-[var(--color-hairline)] flex flex-col justify-between items-center py-4 select-none"
    >
      {/* 1. TOP BRAND / LOGO */}
      <div className="flex flex-col items-center gap-4 w-full">
        <button
          id="sidebar-brand-logo"
          type="button"
          onClick={() => setActiveTab('dashboard')}
          onMouseEnter={() => setHoveredTab('brand-logo')}
          onMouseLeave={() => setHoveredTab(null)}
          className="relative group p-1 focus:outline-none cursor-pointer"
          title="Masakula System"
        >
          <div className="text-red-600 font-black text-2xl hover:scale-110 transition-transform">
            M
          </div>

          {/* Tooltip for Brand */}
          {hoveredTab === 'brand-logo' && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 bg-[var(--color-ink)] text-[var(--color-surface)] text-xs font-semibold rounded-[var(--radius-sm)] shadow-[var(--shadow-pop)] whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-red-500">Masakula</span>
                <span className="text-zinc-300 font-normal">System</span>
              </div>
            </div>
          )}
        </button>

        <div className="w-8 h-px bg-[var(--color-hairline)]" />

        {/* 2. MAIN NAVIGATION ICONS */}
        <nav className="flex flex-col items-center gap-2.5 w-full px-2" aria-label="Navegação Principal">
          {MAIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentActiveTab === item.id;
            const isHovered = hoveredTab === item.id;

            // Badges
            let badgeText: string | number | null = null;
            let badgeStyle = 'bg-[var(--color-danger)] text-white';
            if (item.id === 'products' && lowStockCount > 0) {
              badgeText = lowStockCount;
              badgeStyle = 'bg-[var(--color-danger)] text-white';
            } else if (item.id === 'service_orders' && pendingOrdersCount > 0) {
              badgeText = pendingOrdersCount;
              badgeStyle = 'bg-[var(--color-warning)] text-white';
            }

            return (
              <div key={item.id} className="relative flex items-center justify-center w-full">
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-[var(--color-ink)]" />
                )}
                <button
                  id={`nav-btn-${item.id}`}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  onMouseEnter={() => setHoveredTab(item.id)}
                  onMouseLeave={() => setHoveredTab(null)}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group p-2.5 rounded-[var(--radius-lg)] transition relative cursor-pointer ${
                    isActive
                      ? 'bg-[var(--color-ink)] text-[var(--color-surface)] shadow-[var(--shadow-md)]'
                      : 'hover:bg-[var(--color-surface-muted)] text-[var(--color-ink-muted)] active:scale-95'
                  }`}
                >
                  <div className="transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-12">
                    <Icon
                      size={20}
                      className={isActive ? 'text-[var(--color-surface)]' : 'text-current'}
                    />
                  </div>

                  {/* Notification Badge */}
                  {badgeText !== null && (
                    <span
                      className={`absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center rounded-full text-[9px] font-black border-2 border-[var(--color-surface)] ${badgeStyle}`}
                    >
                      {badgeText}
                    </span>
                  )}
                </button>

                {/* Tooltip on Hover */}
                {isHovered && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 bg-[var(--color-ink)] text-[var(--color-surface)] text-[11px] font-bold rounded-[var(--radius-sm)] shadow-[var(--shadow-pop)] whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center gap-1.5">
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="text-[10px] text-[var(--color-brand)] font-normal">(Ativo)</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* 3. FOOTER FIXED SETTINGS & ACTIONS */}
      <div className="flex flex-col items-center gap-2.5 w-full px-2 pt-2 border-t border-[var(--color-hairline)]">
        {/* Settings (Fixo no Rodapé) */}
        {(() => {
          const Icon = SETTINGS_ITEM.icon;
          const isActive = currentActiveTab === SETTINGS_ITEM.id;
          const isHovered = hoveredTab === SETTINGS_ITEM.id;

          return (
            <div className="relative flex items-center justify-center w-full">
              <button
                id="nav-btn-settings"
                type="button"
                onClick={() => setActiveTab(SETTINGS_ITEM.id)}
                onMouseEnter={() => setHoveredTab(SETTINGS_ITEM.id)}
                onMouseLeave={() => setHoveredTab(null)}
                aria-label={SETTINGS_ITEM.label}
                aria-current={isActive ? 'page' : undefined}
                className={`group p-2.5 rounded-[var(--radius-lg)] transition relative cursor-pointer ${
                  isActive
                    ? 'bg-[var(--color-ink)] text-[var(--color-surface)] shadow-[var(--shadow-md)]'
                    : 'text-[var(--color-ink-faint)] hover:bg-[var(--color-surface-muted)] active:scale-95'
                }`}
              >
                <div className="transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-12">
                  <Icon
                    size={20}
                    className={isActive ? 'text-[var(--color-surface)]' : 'text-current'}
                  />
                </div>
              </button>

              {/* Tooltip */}
              {isHovered && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 bg-[var(--color-ink)] text-[var(--color-surface)] text-[11px] font-bold rounded-[var(--radius-sm)] shadow-[var(--shadow-pop)] whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                  <span>{SETTINGS_ITEM.label}</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Logout Action */}
        {onLogout && (
          <div className="relative flex items-center justify-center w-full">
            <button
              type="button"
              onClick={onLogout}
              onMouseEnter={() => setHoveredTab('logout')}
              onMouseLeave={() => setHoveredTab(null)}
              title="Sair"
              className="p-2.5 rounded-[var(--radius-lg)] text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition cursor-pointer"
            >
              <LogOut size={20} />
            </button>
            {hoveredTab === 'logout' && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 bg-[var(--color-ink)] text-[var(--color-surface)] text-[11px] font-bold rounded-[var(--radius-sm)] shadow-[var(--shadow-pop)] whitespace-nowrap pointer-events-none">
                <span>Sair</span>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
