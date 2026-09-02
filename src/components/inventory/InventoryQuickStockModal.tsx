import React, { useState } from 'react';
import { 
  X, 
  Boxes, 
  Plus, 
  Minus, 
  Search, 
  Check, 
  AlertTriangle, 
  Building2, 
  Calendar 
} from 'lucide-react';
import { Product } from '../../types';
import { formatKz } from '../../utils/formatters';

interface InventoryQuickStockModalProps {
  isOpen: boolean;
  products: Product[];
  onClose: () => void;
  onApplyStockEntry: (productId: string, qtyAdded: number, reason: string, supplier?: string, newBatch?: string) => void;
}

export const InventoryQuickStockModal: React.FC<InventoryQuickStockModalProps> = ({
  isOpen,
  products,
  onClose,
  onApplyStockEntry,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [searchFilter, setSearchFilter] = useState('');
  const [quantity, setQuantity] = useState<string>('10');
  const [supplier, setSupplier] = useState('');
  const [batch, setBatch] = useState(`L-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [reason, setReason] = useState('Entrada de Mercadoria / Compra');

  if (!isOpen) return null;

  const selectedProduct = products.find(p => p.id === selectedProductId) || products[0];

  const filteredProducts = products.filter(p => 
    !searchFilter ||
    p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.barcode.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity) || 0;
    if (qty <= 0 || !selectedProduct) return;

    onApplyStockEntry(selectedProduct.id, qty, reason, supplier, batch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Boxes size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-zinc-900">Entrada Rápida de Estoque</h2>
              <p className="text-xs text-zinc-500">Reposição de estoque e registro de novo lote de fornecedor</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-white">
          
          {/* Seletor com Busca de Produto */}
          <div>
            <label className="text-xs font-bold text-zinc-700 mb-1.5 block">
              Selecionar Artigo / Produto para Repor:
            </label>
            
            <div className="space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Pesquisar produto por nome ou SKU..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
                />
              </div>

              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
              >
                {filteredProducts.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — Atual: {p.stock} {p.unit} ({formatKz(p.salePrice)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Card Resumo do Produto Selecionado */}
          {selectedProduct && (
            <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 font-mono">{selectedProduct.sku}</span>
                <p className="text-xs font-extrabold text-zinc-900 truncate max-w-xs">{selectedProduct.name}</p>
                <span className="text-[11px] text-zinc-600">Preço: {formatKz(selectedProduct.salePrice)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 block">Estoque Atual</span>
                <span className="font-mono font-black text-sm text-zinc-900">
                  {selectedProduct.stock} {selectedProduct.unit}
                </span>
              </div>
            </div>
          )}

          {/* Quantidade a Adicionar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-700 mb-1.5 block">
                Quantidade a Adicionar (+) *
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-2xl px-3.5 py-2.5 text-sm font-mono font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 mb-1.5 block">
                Número do Novo Lote
              </label>
              <input
                type="text"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
              />
            </div>
          </div>

          {/* Fornecedor & Motivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-700 mb-1.5 block">
                Fornecedor
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Ex: Distribuidora Central"
                className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-2xl px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 mb-1.5 block">
                Motivo / Justificativa
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-zinc-50 focus:bg-white border border-zinc-300 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
              >
                <option value="Entrada de Mercadoria / Compra">Compra / Fornecedor</option>
                <option value="Devolução de Cliente">Devolução de Cliente</option>
                <option value="Ajuste de Inventário">Ajuste de Inventário</option>
                <option value="Transferência entre Filiais">Transferência</option>
              </select>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-zinc-200 flex items-center justify-between gap-3 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition cursor-pointer border border-zinc-200"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs transition cursor-pointer shadow-md flex items-center gap-2"
            >
              <Check size={16} className="stroke-[3]" />
              <span>Confirmar Entrada no Estoque</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
