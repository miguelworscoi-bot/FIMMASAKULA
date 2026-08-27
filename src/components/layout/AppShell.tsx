import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Package, 
  Wrench, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings,
  Sparkles,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { ActiveTab, NavigationTab, Product, WorkOrder, Customer, SaleTransaction, CompanySettings, UserSession } from '../../types';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DashboardView } from '../views/DashboardView';
import { ProductsView } from '../views/ProductsView';
import { ServiceOrdersView } from '../views/ServiceOrdersView';
import { PosView } from '../views/PosView';
import { CustomersView } from '../views/CustomersView';
import { ReportsView } from '../views/ReportsView';
import { SettingsView } from '../views/SettingsView';
import { 
  loadStoredProducts, 
  saveStoredProducts, 
  loadStoredWorkOrders, 
  saveStoredWorkOrders,
  loadStoredCustomers,
  saveStoredCustomers,
  loadStoredSales,
  saveStoredSales,
  loadStoredSettings,
  saveStoredSettings
} from '../../utils/storage';
import { supabase } from '../../lib/supabase';
import { supabaseService } from '../../services/supabaseService';

interface AppShellProps {
  userSession?: UserSession;
  onLogout?: () => void;
  onRestartIntro?: () => void;
}

export const TAB_METADATA: Record<ActiveTab, {
  title: string;
  subtitle: string;
  statusMessage: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  phase: string;
}> = {
  dashboard: {
    title: 'Painel Geral',
    subtitle: 'Visão executiva e métricas em tempo real em Kwanzas (Kz)',
    statusMessage: 'Módulo ativo. Acompanhe os indicadores chave, faturamento diário e alertas de estoque.',
    icon: LayoutDashboard,
    phase: 'Fase 1 • Ativo',
  },
  products: {
    title: 'Gestão de Produtos',
    subtitle: 'Catálogo de artigos, controle de estoque e margens de lucro em Kwanzas (Kz)',
    statusMessage: 'Módulo pronto. Gerencie o catálogo, código de barras EAN-13, entradas de estoque e preços.',
    icon: Package,
    phase: 'Fase 1 • Operacional',
  },
  service_orders: {
    title: 'Ordens de Serviço',
    subtitle: 'Acompanhamento técnico de reparações, peças e orçamentos em Kwanzas (Kz)',
    statusMessage: 'Módulo pronto. Cadastre ordens de serviço, atribua técnicos e controle estados (Concluído, Em Andamento, Pendente).',
    icon: Wrench,
    phase: 'Fase 1 • Operacional',
  },
  sales: {
    title: 'Vendas & PDV',
    subtitle: 'Faturamento rápido de balcão, caixa e emissão de talões AGT',
    statusMessage: 'Módulo pronto. Frente de caixa ágil, pagamentos múltiplos (TPA, Cash) e emissão de recibos.',
    icon: ShoppingCart,
    phase: 'Fase 1 • Operacional',
  },
  customers: {
    title: 'Clientes',
    subtitle: 'Cadastro de clientes particulares e empresas com NIF',
    statusMessage: 'Módulo pronto. Histórico de compras, crédito em conta corrente e conformidade fiscal AGT.',
    icon: Users,
    phase: 'Fase 1 • Operacional',
  },
  reports: {
    title: 'Relatórios',
    subtitle: 'Balanço financeiro, mapas de vendas e conformidade fiscal AGT',
    statusMessage: 'Módulo pronto. Análise de desempenho comercial, curva ABC e exportação SAF-T AO.',
    icon: BarChart3,
    phase: 'Fase 1 • Operacional',
  },
  settings: {
    title: 'Configurações',
    subtitle: 'Empresa, parâmetros AGT, moedas locais (Kz) e preferências do sistema',
    statusMessage: 'Módulo pronto. Configurações da empresa, séries de faturação e dados fiscais.',
    icon: Settings,
    phase: 'Fase 1 • Operacional',
  },
};

export const AppShell: React.FC<AppShellProps> = ({
  userSession,
  onLogout,
  onRestartIntro,
}) => {
  // 3. Gerenciador de estado central (activeTab)
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState<boolean>(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);

  // Application Data States with localStorage Persistence
  const [products, setProducts] = useState<Product[]>(() => loadStoredProducts());
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => loadStoredWorkOrders());
  const [customers, setCustomers] = useState<Customer[]>(() => loadStoredCustomers());
  const [sales, setSales] = useState<SaleTransaction[]>(() => loadStoredSales());
  const [settings, setSettings] = useState<CompanySettings>(() => loadStoredSettings());

  // Supabase Initial Fetch & Realtime Channels Subscription
  useEffect(() => {
    let isMounted = true;

    async function syncSupabase() {
      setIsSupabaseSyncing(true);
      try {
        const [prodResult, orderResult, salesResult] = await Promise.all([
          supabaseService.getProducts(),
          supabaseService.getServiceOrders(),
          supabaseService.getSales(),
        ]);

        if (isMounted) {
          if (prodResult.fromSupabase && prodResult.data.length > 0) {
            setProducts(prodResult.data);
            setSupabaseConnected(true);
          }
          if (orderResult.fromSupabase && orderResult.data.length > 0) {
            setWorkOrders(orderResult.data);
            setSupabaseConnected(true);
          }
          if (salesResult.fromSupabase && salesResult.data.length > 0) {
            setSales(salesResult.data);
            setSupabaseConnected(true);
          }
        }
      } catch (err) {
        console.warn('Supabase sync notice:', err);
      } finally {
        if (isMounted) setIsSupabaseSyncing(false);
      }
    }

    syncSupabase();

    // Subscribe to Realtime Channels
    const productsChannel = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        const res = await supabaseService.getProducts();
        if (res.fromSupabase && isMounted) {
          setProducts(res.data);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && isMounted) setSupabaseConnected(true);
      });

    const ordersChannel = supabase
      .channel('public:service_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_orders' }, async () => {
        const res = await supabaseService.getServiceOrders();
        if (res.fromSupabase && isMounted) {
          setWorkOrders(res.data);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && isMounted) setSupabaseConnected(true);
      });

    const salesChannel = supabase
      .channel('public:sales')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, async () => {
        const res = await supabaseService.getSales();
        if (res.fromSupabase && isMounted) {
          setSales(res.data);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && isMounted) setSupabaseConnected(true);
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(salesChannel);
    };
  }, []);

  // Automatic Persistence to localStorage
  useEffect(() => {
    saveStoredProducts(products);
  }, [products]);

  useEffect(() => {
    saveStoredWorkOrders(workOrders);
  }, [workOrders]);

  useEffect(() => {
    saveStoredCustomers(customers);
  }, [customers]);

  useEffect(() => {
    saveStoredSales(sales);
  }, [sales]);

  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  // Computed Badge Metrics
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
  const openWorkOrdersCount = workOrders.filter(wo => wo.status !== 'delivered' && wo.status !== 'canceled').length;
  const todaySalesTotal = sales.reduce((acc, s) => acc + s.total, 0);

  const currentTabMeta = TAB_METADATA[activeTab] || TAB_METADATA.dashboard;
  const IconComponent = currentTabMeta.icon;

  // View switch based on activeTab
  const renderCurrentView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            setActiveTab={(tab) => {
              if (tab === 'pos') setActiveTab('sales');
              else if (tab === 'services') setActiveTab('service_orders');
              else setActiveTab(tab as ActiveTab);
            }}
            products={products}
            workOrders={workOrders}
            customers={customers}
            sales={sales}
          />
        );
      case 'products':
        return (
          <ProductsView
            products={products}
            setProducts={setProducts}
          />
        );
      case 'service_orders':
        return (
          <ServiceOrdersView
            workOrders={workOrders}
            setWorkOrders={setWorkOrders}
          />
        );
      case 'sales':
        return (
          <PosView
            products={products}
            setProducts={setProducts}
            sales={sales}
            setSales={setSales}
            customers={customers}
          />
        );
      case 'customers':
        return (
          <CustomersView
            customers={customers}
            setCustomers={setCustomers}
          />
        );
      case 'reports':
        return (
          <ReportsView
            sales={sales}
            products={products}
          />
        );
      case 'settings':
        return (
          <SettingsView
            settings={settings}
            setSettings={setSettings}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div 
      id="masakula-app-shell" 
      className="min-h-screen bg-[#fcfcfc] text-zinc-950 font-sans flex antialiased selection:bg-zinc-900 selection:text-white"
    >
      {/* 1. App Shell com Sidebar lateral fixa (64px de largura / w-16) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'services') setActiveTab('service_orders');
          else if (tab === 'pos') setActiveTab('sales');
          else setActiveTab(tab as ActiveTab);
        }}
        lowStockCount={lowStockCount}
        pendingOrdersCount={openWorkOrdersCount}
        userSession={userSession}
        onLogout={onLogout}
        onRestartIntro={onRestartIntro}
      />

      {/* Main Workspace Frame (ml-16 offset for 64px fixed sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 ml-16 transition-all duration-200">
        {/* Sticky Header with Contextual Breadcrumbs */}
        <Header
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'services') setActiveTab('service_orders');
            else if (tab === 'pos') setActiveTab('sales');
            else setActiveTab(tab as ActiveTab);
          }}
          todaySalesTotal={todaySalesTotal}
          lowStockCount={lowStockCount}
          openOSCount={openWorkOrdersCount}
          onOpenQuickSale={() => setActiveTab('sales')}
          onOpenQuickOS={() => setActiveTab('service_orders')}
          onOpenQuickProduct={() => setActiveTab('products')}
        />

        {/* 5. Área Principal que exibe o título da tela selecionada e mensagem simples de aguardo para o próximo módulo */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Phase 1 Module Banner Card */}
          <div 
            id={`module-banner-${activeTab}`}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shrink-0 shadow-sm">
                <IconComponent size={22} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-gray-900 capitalize tracking-tight">
                    {currentTabMeta.title}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700">
                    Kz (AOA)
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Módulo <span className="font-bold text-gray-700">{activeTab}</span> ativo. Pronto para receber os componentes da próxima fase.
                </p>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 bg-[#fcfcfc] px-3.5 py-2 rounded-2xl border border-gray-100 text-xs text-zinc-600 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[11px] font-medium text-zinc-700">
                {currentTabMeta.statusMessage}
              </span>
            </div>
          </div>

          {/* Dynamic Content of the Active Screen */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="h-full"
            >
              {renderCurrentView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
