import React from 'react';
import { Wrench, ArrowUpRight, Circle } from 'lucide-react';
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

const paymentMeta: Record<SaleTransaction['paymentMethod'], { label: string; dot: string }> = {
  transfer: { label: 'Transferência', dot: 'bg-ink-faint' },
  multicaixa: { label: 'Multicaixa', dot: 'bg-info' },
  cash: { label: 'Dinheiro', dot: 'bg-brand' },
};

/* ------------------------------------------------------------------ */
/* KPI cell — editorial ledger figure, no boxes, hairline separated    */
/* ------------------------------------------------------------------ */
interface StatProps {
  label: string;
  value: string | number;
  hint: string;
  onClick: () => void;
  accent?: 'ink' | 'brand' | 'danger' | 'warning';
}

const Stat: React.FC<StatProps> = ({ label, value, hint, onClick, accent = 'ink' }) => {
  const valueColor =
    accent === 'brand'
      ? 'text-brand'
      : accent === 'danger'
        ? 'text-danger'
        : accent === 'warning'
          ? 'text-warning'
          : 'text-ink';
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-3 px-5 py-6 text-left transition-colors hover:bg-surface-muted focus:outline-none focus-visible:bg-surface-muted"
    >
      <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-ink-muted">
        {label}
      </span>
      <span
        className={`font-mono text-[1.75rem] font-semibold leading-none tracking-tight tabular-nums ${valueColor}`}
      >
        {value}
      </span>
      <span className="flex items-center gap-1 text-[11px] text-ink-faint">
        {hint}
        <ArrowUpRight
          size={11}
          className="opacity-0 transition-opacity group-hover:opacity-100"
        />
      </span>
    </button>
  );
};

/* ------------------------------------------------------------------ */
/* Signature element — sales flow strip built from real transactions   */
/* ------------------------------------------------------------------ */
const SalesFlow: React.FC<{ sales: SaleTransaction[] }> = ({ sales }) => {
  // Oldest → newest, capped so the strip stays legible
  const series = [...sales].slice(0, 44).reverse();
  const max = Math.max(...series.map((s) => s.total), 1);

  if (series.length === 0) {
    return (
      <div className="flex h-28 items-center justify-center border border-dashed border-hairline">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
          Sem movimento registado hoje
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex h-28 items-end gap-[3px]"
      role="img"
      aria-label={`Fluxo de ${series.length} vendas do dia`}
    >
      {series.map((s, i) => {
        const h = Math.max(6, Math.round((s.total / max) * 100));
        const isPeak = s.total === max;
        return (
          <div
            key={s.id}
            title={`${s.invoiceNumber} · ${formatKz(s.total)}`}
            style={{ height: `${h}%` }}
            className={`min-w-[3px] flex-1 rounded-t-[2px] transition-colors ${
              isPeak ? 'bg-brand-strong' : 'bg-brand/35 hover:bg-brand/70'
            }`}
            data-index={i}
          />
        );
      })}
    </div>
  );
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  products,
  workOrders,
  customers,
  sales,
}) => {
  const totalSalesToday = sales.reduce((acc, sale) => acc + sale.total, 0);
  const lowStockItems = products.filter((p) => p.stock <= p.minStock);
  const openWorkOrders = workOrders.filter(
    (wo) => wo.status !== 'delivered' && wo.status !== 'canceled',
  );
  const totalInventoryValue = products.reduce((acc, p) => acc + p.stock * p.costPrice, 0);
  const totalPotentialRevenue = products.reduce((acc, p) => acc + p.stock * p.salePrice, 0);
  const recentSales = sales.slice(0, 6);

  const today = new Date().toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  return (
    <div id="view-dashboard" className="animate-in fade-in duration-200">
      {/* ---------------------------------------------------------- */}
      {/* Masthead                                                    */}
      {/* ---------------------------------------------------------- */}
      <header className="flex flex-col gap-4 border-b border-ink pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-ink-muted">
            WORSCOI · Painel de Controlo
          </p>
          <h1 className="mt-2 text-[2rem] font-semibold leading-none tracking-tight text-ink text-balance">
            Balcão &amp; Oficina
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted first-letter:uppercase">
            {today}
          </span>
          <span className="inline-flex items-center gap-1.5 border border-brand/30 bg-brand-soft px-2.5 py-1">
            <Circle size={7} className="animate-pulse fill-brand text-brand" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-ink">
              Sessão ativa
            </span>
          </span>
        </div>
      </header>

      {/* ---------------------------------------------------------- */}
      {/* KPI ledger strip                                            */}
      {/* ---------------------------------------------------------- */}
      <section className="grid grid-cols-2 divide-x divide-y divide-hairline border-b border-hairline sm:divide-y-0 lg:grid-cols-4">
        <Stat
          label="Faturação Hoje"
          value={formatKz(totalSalesToday)}
          hint={`${sales.length} ${sales.length === 1 ? 'venda' : 'vendas'}`}
          onClick={() => setActiveTab('reports')}
          accent="brand"
        />
        <Stat
          label="O.S. em Andamento"
          value={openWorkOrders.length}
          hint="Requerem atenção"
          onClick={() => setActiveTab('services')}
          accent={openWorkOrders.length > 0 ? 'warning' : 'ink'}
        />
        <Stat
          label="Alertas de Stock"
          value={lowStockItems.length}
          hint={lowStockItems.length > 0 ? 'Reposição necessária' : 'Tudo em ordem'}
          onClick={() => setActiveTab('products')}
          accent={lowStockItems.length > 0 ? 'danger' : 'brand'}
        />
        <Stat
          label="Valor em Armazém"
          value={formatKz(totalInventoryValue)}
          hint={`Venda prev. ${formatKz(totalPotentialRevenue)}`}
          onClick={() => setActiveTab('reports')}
        />
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Main grid                                                   */}
      {/* ---------------------------------------------------------- */}
      <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2">
          {/* Signature: sales flow */}
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
              Fluxo de Vendas
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              por transação
            </span>
          </div>
          <SalesFlow sales={sales} />

          {/* Recent sales ledger */}
          <div className="mt-10 mb-3 flex items-baseline justify-between">
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
              Últimas Vendas
            </h2>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className="group inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted transition-colors hover:text-ink"
            >
              Ver todas
              <ArrowUpRight size={12} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>

          {recentSales.length === 0 ? (
            <div className="border-t border-ink py-12 text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
                Ainda sem vendas hoje
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-y border-ink">
                  <th className="py-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                    Doc
                  </th>
                  <th className="py-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                    Cliente
                  </th>
                  <th className="py-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                    Pagamento
                  </th>
                  <th className="py-2.5 text-right font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => {
                  const pay = paymentMeta[sale.paymentMethod] ?? paymentMeta.cash;
                  return (
                    <tr
                      key={sale.id}
                      className="border-b border-hairline transition-colors hover:bg-surface-muted"
                    >
                      <td className="py-3 pr-3 font-mono text-xs font-semibold tabular-nums text-ink">
                        {sale.invoiceNumber}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="text-sm text-ink">{sale.customerName}</div>
                        {sale.customerNif && (
                          <div className="font-mono text-[10px] tabular-nums text-ink-faint">
                            NIF {sale.customerNif}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                          <span className={`h-1.5 w-1.5 rounded-full ${pay.dot}`} />
                          {pay.label}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-sm font-semibold tabular-nums text-ink">
                        {formatKz(sale.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Right column — repair orders */}
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
              Assistência Técnica
            </h2>
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted transition-colors hover:text-ink"
            >
              Gerir
            </button>
          </div>

          {workOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 border-t border-ink py-12 text-center">
              <Wrench size={18} className="text-ink-faint" />
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
                Sem O.S. abertas
              </p>
            </div>
          ) : (
            <ul className="border-t border-ink">
              {workOrders.slice(0, 5).map((wo) => {
                const statusConfig = getWorkOrderStatusConfig(wo.status);
                return (
                  <li key={wo.id}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('services')}
                      className="group flex w-full items-start justify-between gap-3 border-b border-hairline py-3.5 text-left transition-colors hover:bg-surface-muted"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold tabular-nums text-ink">
                            {wo.code}
                          </span>
                          <span
                            className={`rounded-sm border px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-wide ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                          >
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm text-ink-soft">{wo.equipment}</p>
                        <p className="truncate text-[11px] text-ink-faint">{wo.customerName}</p>
                      </div>
                      <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-ink">
                        {formatKz(wo.totalCost)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Mais vendidos — retained signature carousel                 */}
      {/* ---------------------------------------------------------- */}
      <div className="mt-12">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
            Mais Vendidos
          </h2>
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted transition-colors hover:text-ink"
          >
            Abrir PDV
          </button>
        </div>
        <TopProductsCarousel onAddToCart={() => setActiveTab('pos')} />
      </div>
    </div>
  );
};
