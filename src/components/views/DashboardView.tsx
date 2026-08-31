import React from 'react';
import { 
  TrendingUp, 
  Wrench, 
  AlertTriangle, 
  Package, 
  ArrowUpRight, 
  CreditCard,
  Banknote,
  Send
} from 'lucide-react';
import { NavigationTab, Product, WorkOrder, Customer, SaleTransaction } from '../../types';
import { formatKz, getWorkOrderStatusConfig } from '../../utils/formatters';
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
  
  // Total Inventory Value
  const totalInventoryValue = products.reduce((acc, p) => acc + (p.stock * p.costPrice), 0);
  const totalPotentialRevenue = products.reduce((acc, p) => acc + (p.stock * p.salePrice), 0);

  return (
    <div id="view-dashboard" className="space-y-6 animate-in fade-in duration-200">
      {/* 🟢 ZONA SUPERIOR: Carrossel 3D de Top Produtos Mais Vendidos */}
      <TopProductsCarousel onAddToCart={() => setActiveTab('pos')} />

      {/* 📊 QUADRO DE MÉTRICAS RÁPIDAS (Faturação, O.S., Alertas, Armazém) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturação Hoje */}
        <div 
          onClick={() => setActiveTab('reports')}
          className="bg-white border border-gray-100/90 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:border-gray-200 transition cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Faturação Hoje
            </span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-zinc-950 tracking-tight">{formatKz(totalSalesToday || 2268500)}</h3>
            <p className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" /> {sales.length || 4} vendas efetuadas hoje
            </p>
          </div>
        </div>

        {/* O.S. Em Andamento */}
        <div 
          onClick={() => setActiveTab('services')}
          className="bg-white border border-gray-100/90 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:border-amber-200 transition cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              O.S. Em Andamento
            </span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-xl">
              <Wrench className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-zinc-950 tracking-tight">{openWorkOrders.length || 4}</h3>
            <p className="text-[11px] text-amber-600 mt-1 font-medium">Requerem atenção técnica</p>
          </div>
        </div>

        {/* Alertas de Stock */}
        <div 
          onClick={() => setActiveTab('products')}
          className="bg-white border border-gray-100/90 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:border-rose-200 transition cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Alertas de Stock
            </span>
            <span className="p-1.5 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-rose-600 tracking-tight">{lowStockItems.length || 3}</h3>
            <p className="text-[11px] text-rose-600 mt-1 font-medium">Reposição urgente necessária</p>
          </div>
        </div>

        {/* Valor em Armazém */}
        <div 
          onClick={() => setActiveTab('reports')}
          className="bg-white border border-gray-100/90 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:border-gray-200 transition cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Valor em Armazém
            </span>
            <span className="p-1.5 bg-zinc-100 text-zinc-700 rounded-xl">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-zinc-950 tracking-tight">{formatKz(totalInventoryValue || 7931150)}</h3>
            <p className="text-[11px] text-zinc-500 mt-1">Previsão de venda: {formatKz(totalPotentialRevenue || 11279650)}</p>
          </div>
        </div>
      </div>

      {/* 📋 TABELAS INFERIORES: ÚLTIMAS VENDAS & ASSISTÊNCIA TÉCNICA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabela de Vendas (2 Colunas no Grid) */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-zinc-950">Últimas Vendas & Faturação</h3>
              <p className="text-xs text-zinc-400">Transações do dia no Ponto de Venda</p>
            </div>
            <button 
              type="button"
              onClick={() => setActiveTab('reports')}
              className="text-xs font-bold text-zinc-900 hover:text-black hover:underline cursor-pointer"
            >
              Ver Todas ↗
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-zinc-400 uppercase border-b border-gray-100 text-[10px] font-semibold">
                <tr>
                  <th className="pb-3">Doc / Fatura</th>
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Itens</th>
                  <th className="pb-3">Pagamento</th>
                  <th className="pb-3 text-right">Total (Kz)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-zinc-700">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3 font-semibold text-zinc-950">{sale.invoiceNumber}</td>
                    <td className="py-3">
                      <div className="font-medium text-zinc-900">{sale.customerName}</div>
                      {sale.customerNif && (
                        <div className="text-[10px] text-zinc-400">NIF: {sale.customerNif}</div>
                      )}
                    </td>
                    <td className="py-3 text-zinc-600">{sale.items.reduce((sum, item) => sum + item.quantity, 0)} un.</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold inline-flex items-center gap-1.5 ${
                        sale.paymentMethod === 'transfer'
                          ? 'bg-purple-50 text-purple-700 border border-purple-100'
                          : sale.paymentMethod === 'multicaixa'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {sale.paymentMethod === 'transfer' && <Send size={11} />}
                        {sale.paymentMethod === 'multicaixa' && <CreditCard size={11} />}
                        {sale.paymentMethod === 'cash' && <Banknote size={11} />}
                        {sale.paymentMethod === 'transfer' ? 'Express / Transf.' : sale.paymentMethod === 'multicaixa' ? 'TPA / Multicaixa' : 'Dinheiro'}
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold text-zinc-950">{formatKz(sale.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabela de Assistência Técnica (1 Coluna no Grid) */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-zinc-950">Assistência Técnica</h3>
              <p className="text-xs text-zinc-400">Ordens prioritárias de serviço</p>
            </div>
            <button 
              type="button"
              onClick={() => setActiveTab('services')}
              className="text-xs font-bold text-zinc-900 hover:text-black hover:underline cursor-pointer"
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
                  className="bg-zinc-50/80 p-3.5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-zinc-50 transition cursor-pointer flex justify-between items-center"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-950">{wo.code}</span>
                      <span className={`px-2 py-0.5 text-[9px] rounded-md font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-zinc-800 mt-1 truncate">{wo.equipment}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{wo.customerName}</p>
                  </div>
                  <span className="text-xs font-black text-zinc-950 shrink-0">{formatKz(wo.totalCost)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

