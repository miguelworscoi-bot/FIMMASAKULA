import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Edit, 
  Trash2, 
  Printer, 
  Eye, 
  Plus, 
  Minus, 
  Tag, 
  Building2, 
  MapPin, 
  Check, 
  Copy,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Product } from '../../types';
import { formatKz } from '../../utils/formatters';

interface InventoryProductCardProps {
  product: Product;
  index?: number;
  isManager: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string, name: string) => void;
  onPrintLabel: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  onQuickStockAdjust: (product: Product, delta: number) => void;
}

export const InventoryProductCard: React.FC<InventoryProductCardProps> = ({
  product,
  index = 0,
  isManager,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onPrintLabel,
  onViewDetails,
  onQuickStockAdjust,
}) => {
  const [copiedSku, setCopiedSku] = useState(false);
  const [imageError, setImageError] = useState(false);

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

  // Stock percentage calculation relative to 2x minStock for gauge
  const maxBar = Math.max(product.minStock * 2.5, product.stock, 10);
  const stockPercentage = Math.min(100, Math.max(5, (product.stock / maxBar) * 100));

  // Profit margin calculation
  const cost = product.costPrice || 0;
  const sale = product.salePrice || 0;
  const profit = sale - cost;
  const marginPercent = sale > 0 ? Math.round((profit / sale) * 100) : 0;

  const handleCopySku = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.barcode || product.sku) {
      navigator.clipboard.writeText(product.barcode || product.sku);
      setCopiedSku(true);
      setTimeout(() => setCopiedSku(false), 1800);
    }
  };

  return (
    <motion.div
      id={`product-card-${product.id}`}
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.3, 
        delay: Math.min(index * 0.04, 0.4),
        ease: [0.25, 0.1, 0.25, 1.0]
      }}
      className={`group relative flex flex-col justify-between bg-white hover:bg-white border rounded-3xl p-4 transition-all duration-200 shadow-sm hover:shadow-xl ${
        isSelected 
          ? 'ring-2 ring-[#000000] border-zinc-900 bg-zinc-50/50' 
          : isOutOfStock
          ? 'border-rose-300 hover:border-rose-400'
          : isLowStock
          ? 'border-amber-300 hover:border-amber-400'
          : 'border-zinc-200 hover:border-zinc-300'
      }`}
    >
      {/* Top Header Row: Checkbox, Category Chip & Status Badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {isManager && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(product.id)}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded-md bg-zinc-100 border-zinc-300 text-zinc-900 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-zinc-900"
              title="Selecionar produto"
            />
          )}
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 border border-zinc-200/80 truncate max-w-[130px]">
            {product.category || 'Geral'}
          </span>
        </div>

        {/* Status Badge */}
        {isExpired ? (
          <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
            <XCircle size={11} className="text-rose-600" />
            <span>Vencido</span>
          </span>
        ) : isExpiringSoon ? (
          <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full animate-pulse">
            <Clock size={11} className="text-amber-600" />
            <span>Vence em {daysToExpiry}d</span>
          </span>
        ) : isOutOfStock ? (
          <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
            <XCircle size={11} className="text-rose-600" />
            <span>Esgotado</span>
          </span>
        ) : isLowStock ? (
          <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
            <AlertTriangle size={11} className="text-amber-600" />
            <span>Est. Baixo</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <CheckCircle2 size={11} className="text-emerald-600" />
            <span>Normal</span>
          </span>
        )}
      </div>

      {/* Product Image & Quick Preview Container */}
      <div 
        onClick={() => onViewDetails(product)}
        className="relative w-full h-36 mb-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center p-2 group-hover:bg-zinc-100/70 transition-colors cursor-pointer overflow-hidden"
      >
        {product.imageUrl && !imageError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="max-h-32 w-auto object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105 pointer-events-none"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 font-black text-xl shadow-inner">
            {product.name ? product.name.charAt(0).toUpperCase() : 'P'}
          </div>
        )}

        {/* Overlay Action Prompt on Hover */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
          <span className="px-3 py-1.5 rounded-xl bg-zinc-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xl">
            <Eye size={13} className="text-[#E1FB15]" />
            <span>Ver Detalhes</span>
          </span>
        </div>
      </div>

      {/* Product Title, SKU, Barcode */}
      <div className="space-y-1 mb-3">
        <h3 
          onClick={() => onViewDetails(product)}
          className="font-extrabold text-sm text-zinc-900 hover:text-indigo-600 transition-colors line-clamp-2 leading-tight cursor-pointer"
          title={product.name}
        >
          {product.name}
        </h3>

        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <button
            type="button"
            onClick={handleCopySku}
            className="font-mono text-zinc-600 hover:text-zinc-900 flex items-center gap-1 transition-colors cursor-pointer px-1 py-0.5 rounded hover:bg-zinc-100"
            title="Copiar Código"
          >
            <span>{product.sku || product.barcode}</span>
            {copiedSku ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} className="text-zinc-400" />}
          </button>

          {product.batch && (
            <>
              <span className="text-zinc-300">•</span>
              <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                Lote: {product.batch}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Stock Health Progress Bar */}
      <div className="bg-zinc-50 rounded-2xl p-2.5 border border-zinc-100 mb-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500 text-[11px] font-medium">Estoque Atual:</span>
          <span className={`font-black font-mono text-xs ${
            isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-zinc-900'
          }`}>
            {product.stock} <span className="text-[10px] text-zinc-400 font-normal">{product.unit || 'un'}</span>
          </span>
        </div>

        {/* Visual Progress Gauge */}
        <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isOutOfStock 
                ? 'bg-rose-500 w-full' 
                : isLowStock 
                ? 'bg-amber-500' 
                : 'bg-emerald-500'
            }`}
            style={{ width: `${stockPercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <span>Mín: {product.minStock} {product.unit || 'un'}</span>
          {product.supplier && <span className="truncate max-w-[120px]">{product.supplier}</span>}
        </div>
      </div>

      {/* Price & Financial Margin Display */}
      <div className="flex items-end justify-between gap-2 pt-2 border-t border-zinc-100 mb-3">
        <div>
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block">Preço de Venda</span>
          <div className="font-black text-base text-zinc-950">
            {formatKz(product.salePrice)}
          </div>
        </div>

        {marginPercent > 0 && (
          <div className="text-right">
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-lg">
              <TrendingUp size={10} />
              +{marginPercent}% margem
            </span>
          </div>
        )}
      </div>

      {/* Footer Controls: Fast Quick Adjustment Stepper & Action Icons */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {/* Quick Stock Replenish Stepper (-1 / +1) */}
        {isManager ? (
          <div className="flex items-center bg-zinc-100 border border-zinc-200 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => onQuickStockAdjust(product, -1)}
              disabled={product.stock <= 0}
              className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title="Diminuir 1 un do estoque"
            >
              <Minus size={13} />
            </button>
            <span className="px-2 text-xs font-mono font-bold text-zinc-800">
              {product.stock}
            </span>
            <button
              type="button"
              onClick={() => onQuickStockAdjust(product, 1)}
              className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 transition-colors cursor-pointer"
              title="Adicionar 1 un ao estoque"
            >
              <Plus size={13} />
            </button>
          </div>
        ) : (
          <div className="text-xs font-mono text-zinc-500">
            Disp: <strong className="text-zinc-800">{product.stock} {product.unit}</strong>
          </div>
        )}

        {/* Action Icon Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPrintLabel(product)}
            className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 border border-zinc-200 transition-colors cursor-pointer"
            title="Imprimir Etiquetas & Código de Barras"
          >
            <Printer size={14} />
          </button>

          {isManager && (
            <>
              <button
                type="button"
                onClick={() => onEdit(product)}
                className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 border border-zinc-200 transition-colors cursor-pointer"
                title="Editar Produto & Preço"
              >
                <Edit size={14} />
              </button>

              <button
                type="button"
                onClick={() => onDelete(product.id, product.name)}
                className="p-1.5 rounded-xl bg-zinc-100 hover:bg-rose-50 text-zinc-600 hover:text-rose-600 border border-zinc-200 hover:border-rose-200 transition-colors cursor-pointer"
                title="Excluir Produto"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};
