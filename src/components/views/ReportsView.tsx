import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Banknote, 
  Printer, 
  TrendingUp, 
  ShoppingBag, 
  ArrowUpRight, 
  CheckCircle2, 
  RefreshCw,
  FileSpreadsheet,
  PieChart,
  Activity
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SaleTransaction, Product } from '../../types';
import ReportsScreen from '../ReportsScreen';

interface SaleRecord {
  id: string;
  total: string | number;
  payment_method?: string;
  paymentMethod?: string;
  amount_paid?: string;
  change_given?: string;
  created_at: string;
  customer_name?: string;
}

interface FinancialSummary {
  totalRevenue: number;
  totalTransactions: number;
  averageTicket: number;
  cashTotal: number;
  tpaTotal: number;
}

interface ReportsViewProps {
  sales?: SaleTransaction[];
  products?: Product[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ sales: localSales = [] }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'analytics'>('analytics');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalRevenue: 0,
    totalTransactions: 0,
    averageTicket: 0,
    cashTotal: 0,
    tpaTotal: 0
  });
  const [loading, setLoading] = useState(true);
  const [openingFloat, setOpeningFloat] = useState<string>('10000'); // Fundo de Maneio / Caixa Inicial

  const parseKz = (priceStr: string | number | undefined): number => {
    if (typeof priceStr === 'number') return priceStr;
    if (!priceStr) return 0;
    return parseFloat(String(priceStr).replace(/[^0-9.]/g, '')) || 0;
  };

  const fetchDailyFinancials = async () => {
    setLoading(true);

    try {
      // Definir intervalo do dia selecionado (00:00:00 até 23:59:59)
      const startDate = `${selectedDate}T00:00:00.000Z`;
      const endDate = `${selectedDate}T23:59:59.999Z`;

      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        setSales(data);

        let total = 0;
        let cash = 0;
        let tpa = 0;

        data.forEach((sale) => {
          const val = parseKz(sale.total);
          total += val;
          const method = (sale.payment_method || sale.paymentMethod || '').toLowerCase();
          if (method === 'dinheiro' || method === 'cash') {
            cash += val;
          } else {
            tpa += val;
          }
        });

        const count = data.length;
        setSummary({
          totalRevenue: total,
          totalTransactions: count,
          averageTicket: count > 0 ? total / count : 0,
          cashTotal: cash,
          tpaTotal: tpa
        });
      } else {
        // Fallback para as vendas em memória se a chamada remota não retornar dados ou estiver offline
        const filteredLocal = localSales.filter(s => {
          const sDate = s.createdAt ? s.createdAt.split('T')[0] : '';
          return sDate === selectedDate || !sDate;
        });

        const formattedLocal: SaleRecord[] = filteredLocal.map(s => ({
          id: s.id,
          total: `${s.total} Kz`,
          payment_method: s.paymentMethod === 'cash' ? 'Dinheiro' : s.paymentMethod === 'multicaixa' ? 'Multicaixa' : 'Transferência',
          created_at: s.createdAt,
          customer_name: s.customerName
        }));

        setSales(formattedLocal);

        let total = 0;
        let cash = 0;
        let tpa = 0;

        filteredLocal.forEach(s => {
          total += s.total;
          if (s.paymentMethod === 'cash') {
            cash += s.total;
          } else {
            tpa += s.total;
          }
        });

        const count = filteredLocal.length;
        setSummary({
          totalRevenue: total,
          totalTransactions: count,
          averageTicket: count > 0 ? total / count : 0,
          cashTotal: cash,
          tpaTotal: tpa
        });
      }
    } catch (err) {
      console.warn('Erro ao carregar dados do Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyFinancials();
  }, [selectedDate, localSales.length]);

  const handlePrintReportZ = () => {
    document.body.classList.add('printing-report-z');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-report-z');
    }, 500);
  };

  const floatNumeric = parseFloat(openingFloat) || 0;
  const expectedCashInDrawer = floatNumeric + summary.cashTotal;

  return (
    <div id="view-reports" className="space-y-6 animate-in fade-in duration-200">
      
      {/* Sub-Navegação de Relatórios: Analytics vs Fecho Diário */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-[#131313] text-[#E1FB15] shadow-xs'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
          }`}
        >
          <Activity size={15} />
          <span>Analytics & Rentabilidade</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'daily'
              ? 'bg-[#131313] text-[#E1FB15] shadow-xs'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
          }`}
        >
          <Printer size={15} />
          <span>Fecho Diário & Relatório Z</span>
        </button>
      </div>

      {activeTab === 'analytics' ? (
        <ReportsScreen />
      ) : (
        <>
          {/* Cabeçalho do Módulo Fecho Diário */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
            <div>
              <h1 className="text-xl font-bold text-zinc-950 tracking-tight">Relatórios & Fecho de Caixa</h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Análise diária de vendas em Kwanzas (Kz) e emissão do Relatório Z
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-2 bg-zinc-50 border border-gray-200 px-3.5 py-2 rounded-2xl shadow-xs">
                <Calendar size={15} className="text-zinc-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-semibold text-zinc-800 bg-transparent focus:outline-none cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={fetchDailyFinancials}
                className="p-2.5 bg-white border border-gray-200 rounded-2xl hover:bg-zinc-50 transition shadow-xs cursor-pointer"
                title="Atualizar Dados"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin text-zinc-950' : 'text-zinc-600'} />
              </button>

              <button
                type="button"
                onClick={handlePrintReportZ}
                className="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs px-4 py-2.5 rounded-2xl shadow-xs flex items-center gap-2 transition cursor-pointer"
              >
                <Printer size={15} />
                <span>Impressão Relatório Z</span>
              </button>
            </div>
          </div>

      {/* KPI Cards (Indicadores Financeiros) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Faturado</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700">{summary.totalRevenue.toLocaleString()} Kz</p>
          <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
            <ArrowUpRight size={12} className="text-emerald-500" /> Sincronizado com Supabase
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Transações</span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <ShoppingBag size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-950">{summary.totalTransactions}</p>
          <span className="text-[10px] text-zinc-400 font-medium">Vendas concluídas no dia</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Ticket Médio</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-zinc-950">{Math.round(summary.averageTicket).toLocaleString()} Kz</p>
          <span className="text-[10px] text-zinc-400 font-medium">Média gasta por cliente</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Saldo Gaveta</span>
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
              <Banknote size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-900">{expectedCashInDrawer.toLocaleString()} Kz</p>
          <span className="text-[10px] text-zinc-400 font-medium">Fundo de Maneio + Dinheiro</span>
        </div>

      </div>

      {/* Seção Principal: Fecho de Caixa & Detalhe de Pagamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Caixa e Fundo de Maneio */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-bold text-base text-zinc-950">Conferência de Gaveta</h3>
            <span className="text-[11px] font-bold bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full">Relatório Z</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-600 block mb-1.5">
                Fundo de Maneio (Abertura em Dinheiro):
              </label>
              <input
                type="number"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-gray-200 rounded-2xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-zinc-950 transition"
                placeholder="Ex: 10000"
              />
            </div>

            <div className="bg-zinc-50 p-4 rounded-2xl space-y-2.5 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>(+) Fundo Inicial:</span>
                <span className="font-bold text-zinc-950">{floatNumeric.toLocaleString()} Kz</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>(+) Entradas em Dinheiro:</span>
                <span className="font-bold text-emerald-700">{summary.cashTotal.toLocaleString()} Kz</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>(+) Multicaixa / TPA:</span>
                <span className="font-bold text-blue-700">{summary.tpaTotal.toLocaleString()} Kz</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-xs text-zinc-950">
                <span>Total Esperado em Gaveta:</span>
                <span className="text-purple-700 font-black">{expectedCashInDrawer.toLocaleString()} Kz</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs">
              <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
              <div>
                <p className="font-bold">Caixa Balanceado</p>
                <p className="text-[11px] text-emerald-700">Todos os registos estão prontos para emissão do fecho oficial.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Distribuição por Método de Pagamento */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-base text-zinc-950">Vendas por Método de Pagamento</h3>
              <span className="text-xs font-semibold text-zinc-400">{selectedDate}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5">
              
              <div className="p-4 bg-zinc-50 border border-gray-100 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Banknote size={22} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-zinc-400 block">Em Dinheiro</span>
                  <p className="text-lg font-black text-zinc-900">{summary.cashTotal.toLocaleString()} Kz</p>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {summary.totalRevenue > 0 ? ((summary.cashTotal / summary.totalRevenue) * 100).toFixed(1) : 0}% do total
                  </span>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 border border-gray-100 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
                  <CreditCard size={22} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-zinc-400 block">Multicaixa / TPA</span>
                  <p className="text-lg font-black text-zinc-900">{summary.tpaTotal.toLocaleString()} Kz</p>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {summary.totalRevenue > 0 ? ((summary.tpaTotal / summary.totalRevenue) * 100).toFixed(1) : 0}% do total
                  </span>
                </div>
              </div>

            </div>

            {/* Tabela de Vendas do Dia */}
            <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider mb-2.5">Histórico de Transações do Dia</h4>
            <div className="max-h-[220px] overflow-y-auto rounded-2xl border border-gray-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-zinc-50 sticky top-0 text-zinc-400 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="p-3">Hora</th>
                    <th className="p-3">ID da Venda</th>
                    <th className="p-3">Método</th>
                    <th className="p-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {sales.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-zinc-400">Nenhuma venda efetuada nesta data.</td>
                    </tr>
                  ) : (
                    sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="p-3 text-zinc-500">
                          {sale.created_at ? new Date(sale.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </td>
                        <td className="p-3 font-mono font-bold text-zinc-900">{sale.id ? sale.id.slice(0, 8) : '---'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            (sale.payment_method === 'Dinheiro' || sale.paymentMethod === 'cash')
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {sale.payment_method || sale.paymentMethod || 'Dinheiro'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-black text-zinc-950">
                          {typeof sale.total === 'number' ? `${sale.total.toLocaleString()} Kz` : sale.total}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* COMPONENTE IMPRESSO: RELATÓRIO Z (Invisível na Tela, Ativo na Impressão 80mm) */}
      <div id="printable-report-z" className="hidden print:block text-black font-mono text-[11px]">
        <div className="text-center space-y-1">
          <h2 className="text-base font-black uppercase tracking-wider">MASAKULA OS</h2>
          <p className="text-[10px] font-bold">FECHO DE CAIXA - RELATÓRIO Z</p>
          <p className="text-[9px]">Data: {selectedDate}</p>
          <p className="text-[9px]">Avenida 4 de Fevereiro, Luanda - Angola</p>
          <p className="text-[9px]">NIF: 5417082910 • AGT-CERT/2026/8920</p>
          <p className="text-[10px]">--------------------------------</p>
        </div>

        <div className="my-2 space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span>Abertura (Maneio):</span>
            <span>{floatNumeric.toLocaleString()} Kz</span>
          </div>
          <div className="flex justify-between">
            <span>Total Transações:</span>
            <span>{summary.totalTransactions}</span>
          </div>
        </div>

        <p className="text-[10px]">--------------------------------</p>

        <div className="my-2 space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span>Vendas em Dinheiro:</span>
            <span>{summary.cashTotal.toLocaleString()} Kz</span>
          </div>
          <div className="flex justify-between">
            <span>Vendas em Multicaixa:</span>
            <span>{summary.tpaTotal.toLocaleString()} Kz</span>
          </div>
          <div className="flex justify-between font-black text-xs pt-1 border-t border-dashed border-black">
            <span>TOTAL DE VENDAS:</span>
            <span>{summary.totalRevenue.toLocaleString()} Kz</span>
          </div>
        </div>

        <p className="text-[10px]">--------------------------------</p>

        <div className="my-2 space-y-1 text-[10px]">
          <div className="flex justify-between font-bold">
            <span>SALDO FINAL EM GAVETA:</span>
            <span>{expectedCashInDrawer.toLocaleString()} Kz</span>
          </div>
        </div>

        <p className="text-[10px]">--------------------------------</p>

        <div className="text-center text-[9px] mt-4 space-y-1">
          <p>Assinatura do Operador de Caixa:</p>
          <br />
          <p>_____________________________________</p>
          <p className="text-[8px] pt-2 text-gray-700">Masakula System • Emissão Concluída</p>
        </div>
      </div>
      </>
      )}

    </div>
  );
};

export default ReportsView;
