import React from 'react';
import {
  TrendingUp,
  Wrench,
  AlertTriangle,
  Package,
  CreditCard,
  Banknote,
  Send,
  ArrowUpRight,
  LayoutDashboard,
  Receipt,
} from 'lucide-react';
import { NavigationTab, Product, WorkOrder, Customer, SaleTransaction } from '../../types';
import { formatKz, getWorkOrderStatusConfig } from '../../utils/formatters';
import { TopProductsCarousel } from './TopProductsCarousel';
import { PageHeader, MetricCard, Card, StatusBadge } from '../ui/primitives';
import type { BadgeTone } from '../ui/primitives/StatusBadge';

interface DashboardViewProps {
  setActiveTab: (tab: NavigationTab) => void;
  products: Product[];
  workOrders: WorkOrder[];
  customers: Customer[];
  sales: SaleTransaction[];
}

const paymentConfig: Record<
  SaleTransaction['paymentMethod'],
  { tone: BadgeTone; label: string; icon: React.ComponentType<{ size?: number }> }
> = {
  transfer: { tone: 'neutral', label: 'Express / Transf.', icon: Send },
  multicaixa: { tone: 'info', label: 'TPA / Multicaixa', icon: CreditCard },
  cash: { tone: 'success', label: 'Dinheiro', icon: Banknote },
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  products,
  workOrders,
  customers,
  sales,
}) => {
  // Compute Key Metrics
  const totalSalesToday = sales.reduce((acc, sale) => acc + sale.total, 0);
  const lowStockItems = products.filter((p) => p.stock <= p.minStock);
  const openWorkOrders = workOrders.filter(
    (wo) => wo.status !== 'delivered' && wo.status !== 'canceled',
  );

  // Total Inventory Value
  const totalInventoryValue = products.reduce((acc, p) => acc + p.stock * p.costPrice, 0);
  const totalPotentialRevenue = products.reduce((acc, p) => acc + p.stock * p.salePrice, 0);

  const recentSales = sales.slice(0, 6);

  return (
    <div id="view-dashboard" className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        icon={LayoutDashboard}
        title="Painel de Controlo"
        subtitle="Visão geral do balcão, faturação e assistência técnica em tempo real."
        badge={
          <StatusBadge tone="success" dot pulse size="sm">
            Sessão ativa
          </StatusBadge>
        }
      />

      {/* Carrossel 3D de Top Produtos — elemento de assinatura */}
      <TopProductsCarousel onAddToCart={() => setActiveTab('pos')} />

      {/* Quadro de métricas rápidas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          index={0}
          label="Faturação Hoje"
          value={formatKz(totalSalesToday)}
          icon={TrendingUp}
          tone="brand"
          hint={`${sales.length} ${sales.length === 1 ? 'venda efetuada' : 'vendas efetuadas'} hoje`}
          onClick={() => setActiveTab('reports')}
        />
        <MetricCard
          index={1}
          label="O.S. Em Andamento"
          value={openWorkOrders.length}
          icon={Wrench}
          tone="warning"
          hint="Requerem atenção técnica"
          onClick={() => setActiveTab('services')}
        />
        <MetricCard
          index={2}
          label="Alertas de Stock"
          value={lowStockItems.length}
          icon={AlertTriangle}
          tone="danger"
          hint="Reposição urgente necessária"
          onClick={() => setActiveTab('products')}
        />
        <MetricCard
          index={3}
          label="Valor em Armazém"
          value={formatKz(totalInventoryValue)}
          icon={Package}
          tone="neutral"
          hint={`Previsão de venda: ${formatKz(totalPotentialRevenue)}`}
          onClick={() => setActiveTab('reports')}
        />
      </div>

      {/* Tabelas inferiores */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Últimas vendas */}
        <Card elevation="sm" className="lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--color-hairline)] px-5 py-4">
            <div className="min-w-0">
              <h3 className="text-sm font-bold tracking-tight text-[var(--color-ink)]">
                Últimas Vendas &amp; Faturação
              </h3>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Transações do dia no Ponto de Venda
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs font-bold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-muted)]"
            >
              Ver Todas <ArrowUpRight size={14} />
            </button>
          </div>

          {recentSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-5 py-14 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-ink-faint)]">
                <Receipt size={20} />
              </div>
              <p className="text-sm font-semibold text-[var(--color-ink-soft)]">
                Ainda sem vendas registadas hoje
              </p>
              <p className="text-xs text-[var(--color-ink-muted)]">
                As transações do balcão aparecerão aqui em tempo real.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--color-hairline)] text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
                  <tr>
                    <th className="px-5 py-3">Doc / Fatura</th>
                    <th className="py-3">Cliente</th>
                    <th className="py-3">Itens</th>
                    <th className="py-3">Pagamento</th>
                    <th className="px-5 py-3 text-right">Total (Kz)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-hairline)] text-[var(--color-ink-soft)]">
                  {recentSales.map((sale) => {
                    const pay = paymentConfig[sale.paymentMethod] ?? paymentConfig.cash;
                    const PayIcon = pay.icon;
                    return (
                      <tr
                        key={sale.id}
                        className="transition-colors hover:bg-[var(--color-surface-muted)]"
                      >
                        <td className="px-5 py-3 font-semibold text-[var(--color-ink)]">
                          {sale.invoiceNumber}
                        </td>
                        <td className="py-3">
                          <div className="font-medium text-[var(--color-ink)]">
                            {sale.customerName}
                          </div>
                          {sale.customerNif && (
                            <div className="text-[10px] text-[var(--color-ink-faint)]">
                              NIF: {sale.customerNif}
                            </div>
                          )}
                        </td>
                        <td className="py-3 text-[var(--color-ink-muted)]">
                          {sale.items.reduce((sum, item) => sum + item.quantity, 0)} un.
                        </td>
                        <td className="py-3">
                          <StatusBadge tone={pay.tone} size="sm">
                            <PayIcon size={11} />
                            {pay.label}
                          </StatusBadge>
                        </td>
                        <td
                          data-numeric
                          className="px-5 py-3 text-right font-bold text-[var(--color-ink)]"
                        >
                          {formatKz(sale.total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Assistência técnica */}
        <Card elevation="sm" className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--color-hairline)] px-5 py-4">
            <div className="min-w-0">
              <h3 className="text-sm font-bold tracking-tight text-[var(--color-ink)]">
                Assistência Técnica
              </h3>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Ordens prioritárias de serviço
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs font-bold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-muted)]"
            >
              Gerir O.S.
            </button>
          </div>

          <div className="space-y-2.5 p-4">
            {workOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-ink-faint)]">
                  <Wrench size={20} />
                </div>
                <p className="text-sm font-semibold text-[var(--color-ink-soft)]">
                  Sem ordens de serviço abertas
                </p>
              </div>
            ) : (
              workOrders.slice(0, 4).map((wo) => {
                const statusConfig = getWorkOrderStatusConfig(wo.status);
                return (
                  <button
                    type="button"
                    key={wo.id}
                    onClick={() => setActiveTab('services')}
                    className="flex w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-hairline)] bg-[var(--color-surface-muted)] p-3.5 text-left transition-all hover:border-[var(--color-line-strong)] hover:bg-[var(--color-surface)]"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--color-ink)]">
                          {wo.code}
                        </span>
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[9px] font-semibold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs font-medium text-[var(--color-ink-soft)]">
                        {wo.equipment}
                      </p>
                      <p className="truncate text-[10px] text-[var(--color-ink-faint)]">
                        {wo.customerName}
                      </p>
                    </div>
                    <span
                      data-numeric
                      className="shrink-0 text-xs font-black text-[var(--color-ink)]"
                    >
                      {formatKz(wo.totalCost)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
