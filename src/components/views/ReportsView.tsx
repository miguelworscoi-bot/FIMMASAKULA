import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  CreditCard, 
  Banknote, 
  Send, 
  Download, 
  Printer, 
  Calendar, 
  PieChart, 
  ArrowUpRight,
  FileSpreadsheet
} from 'lucide-react';
import { SaleTransaction, Product } from '../../types';
import { formatKz, formatDateTime } from '../../utils/formatters';

interface ReportsViewProps {
  sales: SaleTransaction[];
  products: Product[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  sales,
  products,
}) => {
  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalTax = sales.reduce((acc, s) => acc + s.tax, 0);
  const totalDiscounts = sales.reduce((acc, s) => acc + s.discount, 0);
  const totalItemsSold = sales.reduce((acc, s) => acc + s.items.reduce((sum, i) => sum + i.quantity, 0), 0);

  // Method Breakdown
  const multicaixaTotal = sales.filter(s => s.paymentMethod === 'multicaixa').reduce((a, s) => a + s.total, 0);
  const cashTotal = sales.filter(s => s.paymentMethod === 'cash').reduce((a, s) => a + s.total, 0);
  const transferTotal = sales.filter(s => s.paymentMethod === 'transfer').reduce((a, s) => a + s.total, 0);

  return (
    <div id="view-reports" className="space-y-6 animate-in fade-in duration-200">
      {/* Header with Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">Relatórios & Fecho de Caixa</h2>
          <p className="text-xs text-zinc-400">
            Resumo fiscal, mapas de IVA e desempenho comercial em Kwanza (Kz)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => alert('Exportando Fecho de Caixa e Faturação em formato Excel (.xlsx)...')}
            className="px-3.5 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet size={15} />
            <span>Exportar Excel</span>
          </button>
          <button
            type="button"
            onClick={() => alert('Imprimindo Relatório Z de Fecho de Caixa em Kz...')}
            className="px-4 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
          >
            <Printer size={15} />
            <span>Imprimir Relatório Z</span>
          </button>
        </div>
      </div>

      {/* Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Faturação Bruta</span>
          <div className="text-2xl font-black text-zinc-950 mt-1">{formatKz(totalRevenue)}</div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Total transacionado</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">IVA Liquidado (14%)</span>
          <div className="text-2xl font-black text-zinc-950 mt-1">{formatKz(totalTax)}</div>
          <span className="text-[11px] text-zinc-500 font-medium mt-1 block">Para mapa fiscal AGT</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Artigos Vendidos</span>
          <div className="text-2xl font-black text-zinc-950 mt-1">{totalItemsSold} un.</div>
          <span className="text-[11px] text-zinc-500 font-medium mt-1 block">Em {sales.length} faturas emitidas</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-gray-100 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Descontos Concedidos</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{formatKz(totalDiscounts)}</div>
          <span className="text-[11px] text-zinc-500 font-medium mt-1 block">Campanhas e cortes de preço</span>
        </div>
      </div>

      {/* Two Column Section: Payment breakdown & Top Selling */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-base text-zinc-950">Distribuição de Pagamentos (Kz)</h3>
            <p className="text-xs text-zinc-400">Detalhamento dos valores recebidos por canal</p>
          </div>

          <div className="space-y-3 text-xs">
            {/* Multicaixa */}
            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center">
                  <CreditCard size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900">TPA / Multicaixa</h4>
                  <span className="text-[10px] text-blue-700 font-semibold">
                    {totalRevenue > 0 ? ((multicaixaTotal / totalRevenue) * 100).toFixed(1) : 0}% do total
                  </span>
                </div>
              </div>
              <span className="font-black text-sm text-zinc-950">{formatKz(multicaixaTotal)}</span>
            </div>

            {/* Dinheiro */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                  <Banknote size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900">Dinheiro em Caixa</h4>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    {totalRevenue > 0 ? ((cashTotal / totalRevenue) * 100).toFixed(1) : 0}% do total
                  </span>
                </div>
              </div>
              <span className="font-black text-sm text-zinc-950">{formatKz(cashTotal)}</span>
            </div>

            {/* Transfer */}
            <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500 text-white flex items-center justify-center">
                  <Send size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900">Transferência Bancária / Express</h4>
                  <span className="text-[10px] text-purple-700 font-semibold">
                    {totalRevenue > 0 ? ((transferTotal / totalRevenue) * 100).toFixed(1) : 0}% do total
                  </span>
                </div>
              </div>
              <span className="font-black text-sm text-zinc-950">{formatKz(transferTotal)}</span>
            </div>
          </div>
        </div>

        {/* Top Products Inventory Summary */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-base text-zinc-950">Artigos em Destaque</h3>
            <p className="text-xs text-zinc-400">Preços e stock em tempo real</p>
          </div>

          <div className="space-y-2.5 text-xs">
            {products.slice(0, 4).map((p) => (
              <div key={p.id} className="p-3 rounded-2xl bg-zinc-50 flex items-center justify-between">
                <div className="truncate max-w-[200px]">
                  <p className="font-bold text-zinc-900 truncate">{p.name}</p>
                  <span className="text-[10px] text-zinc-400">{p.category}</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-zinc-950 block">{formatKz(p.salePrice)}</span>
                  <span className="text-[10px] text-zinc-500">{p.stock} em stock</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
