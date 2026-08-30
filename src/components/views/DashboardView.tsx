import React from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  Wrench, 
  Package, 
  Users, 
  AlertCircle, 
  ArrowUpRight, 
  Clock, 
  CheckCircle,
  CreditCard,
  Banknote,
  Send,
  Building,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { NavigationTab, Product, WorkOrder, Customer, SaleTransaction } from '../../types';
import { formatKz, formatDate, getWorkOrderStatusConfig } from '../../utils/formatters';
import { TopProductsCarousel } from './TopProductsCarousel';

interface DashboardViewProps {
  setActiveTab: (tab: NavigationTab) => void;
  products: Product[];
  workOrders: WorkOrder[];
  customers: Customer[];
  sales: SaleTransaction[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  products,
  workOrders,
  customers,
  sales,
}) => {
  // Compute Key Metrics
  const totalSalesToday = sales.reduce((acc, sale) => acc + sale.total, 0);
  const lowStockItems = products.filter(p => p.stock <= p.minStock);
  const openWorkOrders = workOrders.filter(wo => wo.status !== 'delivered' && wo.status !== 'canceled');
  const activeCustomersCount = customers.length;
  
  // Total Inventory Value
  const totalInventoryValue = products.reduce((acc, p) => acc + (p.stock * p.costPrice), 0);
  const totalPotentialRevenue = products.reduce((acc, p) => acc + (p.stock * p.salePrice), 0);

  return (
    <div id="view-dashboard" className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome Banner with Fast PDV trigger */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-zinc-200 text-xs font-semibold backdrop-blur-md border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Sessão de Caixa Aberta • Operador 01
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Bem-vindo ao Masakula ERP
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Sistema pronto para vendas no balcão, gestão de stock em Kwanzas (Kz) e ordens de assistência técnica com conformidade fiscal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('pos')}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <ShoppingCart size={18} />
              <span>Abrir Frente de Caixa</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm flex items-center gap-2 border border-white/10 transition-all"
            >
              <Wrench size={16} />
              <span>Assistência Técnica</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Selling Products Showcase */}
      <TopProductsCarousel onAddToCart={() => setActiveTab('pos')} />

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturação Hoje */}
        <div className="p-5 rounded-3xl bg-white border border-gray-100/90 shadow-xs hover:border-gray-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Faturação Hoje
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-zinc-950 tracking-tight">
              {formatKz(totalSalesToday)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 font-semibold">
              <ArrowUpRight size={14} />
              <span>{sales.length} vendas efetuadas hoje</span>
            </div>
          </div>
        </div>

        {/* Card 2: Ordens de Serviço */}
        <div 
          onClick={() => setActiveTab('services')}
          className="p-5 rounded-3xl bg-white border border-gray-100/90 shadow-xs hover:border-amber-300 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              O.S. em Andamento
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wrench size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-zinc-950 tracking-tight">
              {openWorkOrders.length}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-600 font-semibold">
              <Clock size={14} />
              <span>Requerem atenção técnica</span>
            </div>
          </div>
        </div>

        {/* Card 3: Stock em Alerta */}
        <div 
          onClick={() => setActiveTab('products')}
          className="p-5 rounded-3xl bg-white border border-gray-100/90 shadow-xs hover:border-rose-300 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Alertas de Stock
            </span>
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600 tracking-tight">
              {lowStockItems.length}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-rose-500 font-semibold">
              <span>{lowStockItems.length > 0 ? 'Reposição urgente necessária' : 'Inventário normal'}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Valor do Inventário */}
        <div 
          onClick={() => setActiveTab('reports')}
          className="p-5 rounded-3xl bg-white border border-gray-100/90 shadow-xs hover:border-gray-200 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Valor em Armazém
            </span>
            <div className="w-9 h-9 rounded-2xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <Package size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-zinc-950 tracking-tight">
              {formatKz(totalInventoryValue)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500 font-medium">
              <span>Previsão de venda: {formatKz(totalPotentialRevenue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Sales & Work Orders Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales Column (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-base text-zinc-950">
                Últimas Vendas & Faturação
              </h3>
              <p className="text-xs text-zinc-400">
                Transações do dia no Ponto de Venda
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className="text-xs font-bold text-zinc-800 hover:text-red-600 transition-colors flex items-center gap-1"
            >
              Ver Todas <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-zinc-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Doc / Fatura</th>
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Itens</th>
                  <th className="pb-3">Pagamento</th>
                  <th className="pb-3 text-right">Total (Kz)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3 font-semibold text-zinc-900">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3">
                      <div className="font-medium text-zinc-800">{sale.customerName}</div>
                      {sale.customerNif && (
                        <div className="text-[10px] text-zinc-400">NIF: {sale.customerNif}</div>
                      )}
                    </td>
                    <td className="py-3 text-zinc-600">
                      {sale.items.reduce((sum, item) => sum + item.quantity, 0)} un.
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[11px] ${
                        sale.paymentMethod === 'multicaixa'
                          ? 'bg-blue-50 text-blue-700'
                          : sale.paymentMethod === 'cash'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-purple-50 text-purple-700'
                      }`}>
                        {sale.paymentMethod === 'multicaixa' && <CreditCard size={11} />}
                        {sale.paymentMethod === 'cash' && <Banknote size={11} />}
                        {sale.paymentMethod === 'transfer' && <Send size={11} />}
                        {sale.paymentMethod === 'multicaixa' ? 'TPA / Multicaixa' : sale.paymentMethod === 'cash' ? 'Dinheiro' : 'Express / Transf.'}
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold text-zinc-950">
                      {formatKz(sale.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Work Orders Status & Quick Alerts (1 Col) */}
        <div className="space-y-6">
          {/* Active Work Orders */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-zinc-950">
                  Assistência Técnica
                </h3>
                <p className="text-xs text-zinc-400">
                  Ordens prioritárias de serviço
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('services')}
                className="text-xs font-bold text-zinc-800 hover:text-red-600 transition-colors"
              >
                Gerir O.S.
              </button>
            </div>

            <div className="space-y-3">
              {workOrders.slice(0, 3).map((wo) => {
                const statusConfig = getWorkOrderStatusConfig(wo.status);
                return (
                  <div 
                    key={wo.id}
                    onClick={() => setActiveTab('services')}
                    className="p-3.5 rounded-2xl bg-zinc-50/60 border border-gray-100 hover:border-zinc-300 cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-zinc-900">{wo.code}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-800 truncate">
                      {wo.equipment}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-zinc-500">
                      <span className="truncate">{wo.customerName}</span>
                      <span className="font-bold text-zinc-900">{formatKz(wo.totalCost)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Low Stock Warning Box */}
          {lowStockItems.length > 0 && (
            <div className="bg-rose-50/60 rounded-3xl p-5 border border-rose-100 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <AlertCircle size={17} />
                <span>Alerta de Ruptura de Stock</span>
              </div>
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs bg-white/80 p-2.5 rounded-xl border border-rose-100/60">
                    <span className="font-medium text-zinc-800 truncate max-w-[150px]">
                      {item.name}
                    </span>
                    <span className="font-black text-rose-600">
                      {item.stock} {item.unit} restantes
                    </span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
              >
                Gerir Entradas de Stock
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
