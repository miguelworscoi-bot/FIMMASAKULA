import React, { useState } from 'react';
import { Sparkles, BrainCircuit, Search, RefreshCw, FileDown, CheckCircle, Calculator, LineChart } from 'lucide-react';
import { useDeadStock, type DeadStockItem } from '../hooks/useDeadStock';
import { formatKz } from '../utils/formatters';
import DeadStockDetectorSection from './DeadStockDetectorSection';
import PriceSimulatorScreen from './PriceSimulatorScreen';
import { generateIntelligencePDF } from '../utils/exportPdf';

export interface MetricCardProps {
  title: string;
  value: string;
  badge: string;
  type?: 'positive' | 'warning';
}

export function ClayMetricCard({ title, value, badge, type = 'positive' }: MetricCardProps) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-[6px_6px_16px_rgba(0,0,0,0.05),-6px_-6px_16px_rgba(255,255,255,1)] space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500 font-bold">{title}</span>
        <span
          className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
            type === 'positive'
              ? 'bg-[#32D583]/15 text-[#131313] border border-[#32D583]/30'
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}
        >
          {badge}
        </span>
      </div>
      <h3 className="text-2xl font-black text-[#131313]">{value}</h3>
    </div>
  );
}

export default function BusinessIntelligenceScreen() {
  const [activeSubTab, setActiveSubTab] = useState<'diagnostics' | 'simulator'>('diagnostics');
  const [query, setQuery] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const { items: deadStockItems, totalCapitalLocked, loading: loadingDeadStock, refresh } = useDeadStock();

  const handleAskAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoadingAI(true);
    setTimeout(() => {
      setAiInsight(
        'Análise de Inteligência: O produto "Refrigerante 330ml" apresenta elevado giro às sextas-feiras. Recomendamos a criação de um combo promocional com produtos de menor saída (ex: "Salgados") para aumentar a margem bruta global.'
      );
      setLoadingAI(false);
    }, 900);
  };

  const handleExportPDF = () => {
    try {
      setIsExporting(true);
      generateIntelligencePDF({
        metrics: {
          averageTicket: '14.500 Kz',
          deadStockCapital: formatKz(totalCapitalLocked > 0 ? totalCapitalLocked : 480000),
          deadStockCount: deadStockItems.length,
          grossMargin: '38,5%',
          repurchaseAlertCount: '4 Produtos',
        },
        aiInsight: aiInsight || 'Análise de Inteligência: Diagnóstico preventivo de rotação e alertas de liquidez gerados pelo motor Masakula.',
        userQuery: query || undefined,
        deadStockItems,
      });

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao gerar relatório PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const getActionLabel = (action: DeadStockItem['suggested_action']) => {
    switch (action) {
      case 'LIQUIDATION':
        return 'Liquidação Imediata';
      case 'COMBO':
        return 'Criar Combo';
      case 'DISCOUNT_15':
      default:
        return 'Aplicar Desconto 15%';
    }
  };

  return (
    <div className="w-full min-h-screen bg-white text-[#131313] p-6 md:p-8 space-y-6">
      
      {/* Cabeçalho da Tela */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#131313] text-[#E1FB15] rounded-2xl shadow-md">
            <BrainCircuit size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#131313] tracking-tight">
              Masakula Intelligence & BI
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Previsão de estoque, diagnóstico de produtos encalhados e consultas por IA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão Exportar Análise PDF */}
          <button
            id="btn-export-bi-pdf"
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer ${
              exportSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-[#131313] text-[#E1FB15] hover:bg-black hover:shadow-md'
            } disabled:opacity-50`}
            title="Exportar Relatório e Diagnóstico em PDF"
          >
            {exportSuccess ? (
              <>
                <CheckCircle size={15} className="text-[#E1FB15]" />
                <span>PDF Gerado!</span>
              </>
            ) : (
              <>
                <FileDown size={15} className={isExporting ? 'animate-bounce' : ''} />
                <span>{isExporting ? 'Exportando...' : 'Exportar Análise'}</span>
              </>
            )}
          </button>

          {/* Botão Atualizar Dados */}
          <button
            type="button"
            onClick={() => refresh()}
            disabled={loadingDeadStock}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-zinc-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition cursor-pointer disabled:opacity-50"
            title="Recarregar análise de Dead Stock"
          >
            <RefreshCw size={14} className={loadingDeadStock ? 'animate-spin' : ''} />
            <span className="hidden md:inline">Atualizar</span>
          </button>
        </div>
      </div>

      {/* Navegação entre Submódulos de BI */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('diagnostics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
            activeSubTab === 'diagnostics'
              ? 'bg-[#131313] text-[#E1FB15] shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <BrainCircuit size={15} />
          <span>Diagnóstico & Dead Stock</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
            activeSubTab === 'simulator'
              ? 'bg-[#131313] text-[#E1FB15] shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Calculator size={15} />
          <span>Simulador de Preços & Margens</span>
        </button>
      </div>

      {activeSubTab === 'simulator' ? (
        <div className="-mx-6 md:-mx-8 -my-6">
          <PriceSimulatorScreen />
        </div>
      ) : (
        <>
          {/* Caixa de Consulta por Linguagem Natural */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[8px_8px_20px_rgba(0,0,0,0.04),-8px_-8px_20px_rgba(255,255,255,1)] space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
              <Sparkles size={16} className="text-[#131313]" />
              <span>Pergunte ao Masakula: "O que está acontecendo com meu negócio?"</span>
            </div>

            <form onSubmit={handleAskAI} className="relative flex items-center">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: 'Qual é o produto com maior margem?' ou 'O que tenho encalhado?'"
                className="w-full bg-gray-50 text-[#131313] text-xs pl-11 pr-32 py-4 rounded-2xl border border-gray-200 focus:border-[#131313] outline-none font-medium placeholder:text-gray-400"
              />
              <Search className="absolute left-4 text-gray-400" size={18} />
              
              <button
                type="submit"
                disabled={loadingAI}
                className="absolute right-2 px-5 py-2.5 bg-[#131313] text-[#E1FB15] font-black text-xs rounded-xl hover:bg-black transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={14} />
                {loadingAI ? 'Analisando...' : 'Consultar'}
              </button>
            </form>

            {/* Resposta do Motor de IA */}
            {aiInsight && (
              <div className="p-4 bg-[#32D583]/10 border border-[#32D583]/40 rounded-2xl text-xs text-gray-800 flex items-start gap-3">
                <Sparkles size={18} className="text-[#131313] shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-[#131313] mb-0.5">Diagnóstico Automático:</p>
                  <p className="leading-relaxed font-medium">{aiInsight}</p>
                </div>
              </div>
            )}
          </div>

          {/* Cards Analíticos de Indicadores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ClayMetricCard title="Ticket Médio" value="14.500 Kz" badge="+8.2%" type="positive" />
            <ClayMetricCard 
              title="Capital em Dead Stock" 
              value={formatKz(totalCapitalLocked > 0 ? totalCapitalLocked : 480000)} 
              badge={`${deadStockItems.length} Itens`} 
              type="warning" 
            />
            <ClayMetricCard title="Margem Bruta Média" value="38,5%" badge="+1.4%" type="positive" />
            <ClayMetricCard title="Previsão de Recompra" value="4 Produtos" badge="Atenção" type="warning" />
          </div>

          {/* Detector e Tabela de Produtos Encalhados (Dead Stock) */}
          <DeadStockDetectorSection />
        </>
      )}
    </div>
  );
}

export { BusinessIntelligenceScreen };
