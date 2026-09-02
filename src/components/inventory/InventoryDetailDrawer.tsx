import React, { useState } from 'react';
import { 
  X, 
  Barcode, 
  Calendar, 
  Building2, 
  MapPin, 
  TrendingUp, 
  Boxes, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Printer, 
  Edit, 
  Trash2, 
  Copy, 
  Check, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw,
  Clock,
  Sparkles,
  ShieldCheck,
  Plus,
  Minus
} from 'lucide-react';
import { Product } from '../../types';
import { formatKz } from '../../utils/formatters';

interface InventoryDetailDrawerProps {
  product: Product | null;
  isOpen: boolean;
  isManager: boolean;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string, name: string) => void;
  onPrintLabel: (product: Product) => void;
  onStockAdjust: (product: Product, newStock: number, reason: string) => void;
}

export const InventoryDetailDrawer: React.FC<InventoryDetailDrawerProps> = ({
  product,
  isOpen,
  isManager,
  onClose,
  onEdit,
  onDelete,
  onPrintLabel,
  onStockAdjust,
}) => {
  const [copiedBarcode, setCopiedBarcode] = useState(false);
  const [copiedSku, setCopiedSku] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState<string>('1');
  const [adjustType, setAdjustType] = useState<'add' | 'subtract' | 'set'>('add');
  const [adjustReason, setAdjustReason] = useState<string>('Entrada de Reposição / Fornecedor');

  if (!isOpen || !product) return null;

  // Helper: Days until expiration
  const getDaysToExpiry = (expiryDateStr?: string): number | null => {
    if (!expiryDateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expiryDateStr);
    if (isNaN(expDate.getTime())) return null;
    expDate.setHours(0, 0, 0, 0);
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysToExpiry = getDaysToExpiry(product.expirationDate);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.minStock;
  const isExpired = daysToExpiry !== null && daysToExpiry <= 0;
  const isExpiringSoon = daysToExpiry !== null && daysToExpiry > 0 && daysToExpiry <= 30;

  // Financial calculations
  const cost = product.costPrice || 0;
  const sale = product.salePrice || 0;
  const unitProfit = sale - cost;
  const profitMarginPercent = sale > 0 ? ((unitProfit / sale) * 100).toFixed(1) : '0';
  const markupPercent = cost > 0 ? (((sale - cost) / cost) * 100).toFixed(1) : '0';
  const totalValuation = product.stock * sale;
  const totalCostValuation = product.stock * cost;

  const handleCopy = (text: string, type: 'barcode' | 'sku') => {
    navigator.clipboard.writeText(text);
    if (type === 'barcode') {
      setCopiedBarcode(true);
      setTimeout(() => setCopiedBarcode(false), 2000);
    } else {
      setCopiedSku(true);
      setTimeout(() => setCopiedSku(false), 2000);
    }
  };

  const handleApplyStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(adjustAmount) || 0;
    if (qty <= 0 && adjustType !== 'set') return;

    let newStock = product.stock;
    if (adjustType === 'add') newStock = product.stock + qty;
    else if (adjustType === 'subtract') newStock = Math.max(0, product.stock - qty);
    else if (adjustType === 'set') newStock = Math.max(0, qty);

    onStockAdjust(product, newStock, adjustReason);
    setAdjustAmount('1');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white border-l border-zinc-200 shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="p-5 border-b border-zinc-200 bg-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900">
                <Boxes size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-zinc-900">Raio-X do Produto & Estoque</h2>
                <p className="text-xs text-zinc-500">Inspeção detalhada de lote, validade e precificação</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
              title="Fechar (Esc)"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-white">
            
            {/* 1. Hero Product Summary Card */}
            <div className="bg-zinc-50 rounded-3xl p-5 border border-zinc-200 flex flex-col sm:flex-row gap-5 items-center sm:items-start">
              {/* Product Photo */}
              <div className="w-28 h-28 shrink-0 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center p-2 overflow-hidden shadow-inner">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="max-h-24 w-auto object-contain drop-shadow-md"
                  />
                ) : (
                  <div className="font-black text-2xl text-zinc-400">
                    {product.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Title & Identifiers */}
              <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 border border-zinc-200">
                    {product.category || 'Geral'}
                  </span>

                  {isExpired ? (
                    <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <XCircle size={11} /> Vencido
                    </span>
                  ) : isExpiringSoon ? (
                    <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <Clock size={11} /> Vence em {daysToExpiry}d
                    </span>
                  ) : isOutOfStock ? (
                    <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <XCircle size={11} /> Esgotado
                    </span>
                  ) : isLowStock ? (
                    <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <AlertTriangle size={11} /> Estoque Baixo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={11} /> Normal
                    </span>
                  )}
                </div>

                <h1 className="text-lg font-extrabold text-zinc-900 leading-tight">
                  {product.name}
                </h1>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-zinc-600">
                  <div className="flex items-center gap-1 font-mono bg-white px-2.5 py-1 rounded-xl border border-zinc-200">
                    <span className="text-zinc-400">SKU:</span>
                    <span className="text-zinc-800 font-semibold">{product.sku}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(product.sku, 'sku')}
                      className="ml-1 text-zinc-400 hover:text-zinc-900"
                      title="Copiar SKU"
                    >
                      {copiedSku ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    </button>
                  </div>

                  {product.barcode && (
                    <div className="flex items-center gap-1 font-mono bg-white px-2.5 py-1 rounded-xl border border-zinc-200">
                      <Barcode size={14} className="text-zinc-400" />
                      <span className="text-zinc-800 font-semibold">{product.barcode}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(product.barcode, 'barcode')}
                        className="ml-1 text-zinc-400 hover:text-zinc-900"
                        title="Copiar Código de Barras"
                      >
                        {copiedBarcode ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Financial & Profitability Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-emerald-600" />
                <span>Indicadores Financeiros & Lucratividade</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Preço de Custo */}
                <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 font-medium block">Preço de Custo</span>
                  <p className="text-sm font-black text-zinc-900 mt-1">{formatKz(cost)}</p>
                  <span className="text-[10px] text-zinc-500">unitário</span>
                </div>

                {/* Preço de Venda */}
                <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 font-medium block">Preço de Venda</span>
                  <p className="text-sm font-black text-zinc-950 mt-1">{formatKz(sale)}</p>
                  <span className="text-[10px] text-zinc-500">unitário</span>
                </div>

                {/* Lucro Bruto Unitário */}
                <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 font-medium block">Lucro Unitário</span>
                  <p className="text-sm font-black text-emerald-600 mt-1">{formatKz(unitProfit)}</p>
                  <span className="text-[10px] text-emerald-700 font-semibold font-mono">+{profitMarginPercent}% margem</span>
                </div>

                {/* Valor Total em Estoque */}
                <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200">
                  <span className="text-[10px] text-zinc-500 font-medium block">Valoração Total</span>
                  <p className="text-sm font-black text-zinc-900 mt-1">{formatKz(totalValuation)}</p>
                  <span className="text-[10px] text-zinc-500 font-mono">Custo: {formatKz(totalCostValuation)}</span>
                </div>
              </div>
            </div>

            {/* 3. Batch, Expiry & Supplier Metadata */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-amber-600" />
                <span>Rastreabilidade de Lote & Fornecedor</span>
              </h3>

              <div className="bg-zinc-50 rounded-3xl p-4 border border-zinc-200 divide-y divide-zinc-200">
                <div className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 flex items-center gap-1.5">
                    <Calendar size={13} className="text-zinc-400" /> Data de Validade:
                  </span>
                  <span className={`font-mono font-bold ${
                    isExpired ? 'text-rose-600' : isExpiringSoon ? 'text-amber-600' : 'text-zinc-900'
                  }`}>
                    {product.expirationDate || 'Sem validade cadastrada'}
                    {daysToExpiry !== null && (
                      <span className="text-[11px] ml-1.5 font-normal text-zinc-500">
                        ({daysToExpiry <= 0 ? 'Vencido' : `${daysToExpiry} dias restantes`})
                      </span>
                    )}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 flex items-center gap-1.5">
                    <Boxes size={13} className="text-zinc-400" /> Número do Lote:
                  </span>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                    {product.batch || 'Lote Padrão'}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 flex items-center gap-1.5">
                    <Building2 size={13} className="text-zinc-400" /> Fornecedor / Fabricante:
                  </span>
                  <span className="font-medium text-zinc-900">
                    {product.supplier || 'Fornecedor padrão / Distribuidor'}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 flex items-center gap-1.5">
                    <MapPin size={13} className="text-zinc-400" /> Localização / Prateleira:
                  </span>
                  <span className="font-medium text-zinc-800">
                    {product.notes || 'Estoque Central (A-01)'}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Quick Stock Adjustment Form (Managers Only) */}
            {isManager && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <RefreshCw size={14} className="text-zinc-700" />
                  <span>Ajuste Rápido de Estoque</span>
                </h3>

                <form onSubmit={handleApplyStockAdjustment} className="bg-zinc-50 p-4 rounded-3xl border border-zinc-200 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustType('add')}
                      className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        adjustType === 'add'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200'
                      }`}
                    >
                      <Plus size={13} /> Entrada (+Qtd)
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdjustType('subtract')}
                      className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        adjustType === 'subtract'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200'
                      }`}
                    >
                      <Minus size={13} /> Saída (-Qtd)
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdjustType('set')}
                      className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        adjustType === 'set'
                          ? 'bg-zinc-900 text-white shadow-sm'
                          : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200'
                      }`}
                    >
                      Ajustar Fixo
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-600 mb-1 block">
                        {adjustType === 'set' ? 'Novo Estoque Total:' : 'Quantidade a Movimentar:'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={adjustAmount}
                        onChange={(e) => setAdjustAmount(e.target.value)}
                        className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-sm font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        placeholder="Ex: 10"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-zinc-600 mb-1 block">
                        Motivo / Justificativa:
                      </label>
                      <select
                        value={adjustReason}
                        onChange={(e) => setAdjustReason(e.target.value)}
                        className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                      >
                        <option value="Entrada de Reposição / Fornecedor">Entrada de Compra / Fornecedor</option>
                        <option value="Devolução de Cliente">Devolução de Cliente</option>
                        <option value="Ajuste de Inventário / Contagem Física">Ajuste de Inventário / Contagem</option>
                        <option value="Perda / Avaria / Quebra">Perda / Avaria / Quebra</option>
                        <option value="Doação ou Consumo Interno">Consumo Interno</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check size={14} />
                    <span>Confirmar Movimentação de Estoque</span>
                  </button>
                </form>
              </div>
            )}

          </div>

          {/* Drawer Footer Actions */}
          <div className="p-5 border-t border-zinc-200 bg-white flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onPrintLabel(product)}
              className="px-4 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs flex items-center gap-2 transition cursor-pointer border border-zinc-200"
            >
              <Printer size={15} />
              <span>Imprimir Etiqueta</span>
            </button>

            {isManager && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDelete(product.id, product.name)}
                  className="p-2.5 rounded-2xl bg-zinc-100 hover:bg-rose-50 text-zinc-600 hover:text-rose-600 border border-zinc-200 hover:border-rose-200 transition cursor-pointer"
                  title="Excluir do Catálogo"
                >
                  <Trash2 size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => onEdit(product)}
                  className="px-5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs flex items-center gap-2 transition cursor-pointer shadow-md"
                >
                  <Edit size={15} />
                  <span>Editar Produto</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
