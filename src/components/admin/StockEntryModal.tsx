import React, { useState } from "react";
import { X, PackagePlus, ArrowDownLeft } from "lucide-react";

export interface StockEntryData {
  productId?: string;
  productName: string;
  quantity: number;
  costPrice?: number;
  supplier?: string;
  notes?: string;
}

export interface StockEntryModalProps {
  onClose: () => void;
  onSave?: (data: StockEntryData) => void;
}

export function StockEntryModal({ onClose, onSave }: StockEntryModalProps) {
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload: StockEntryData = {
      productName,
      quantity: parseInt(quantity, 10) || 0,
      costPrice: costPrice ? parseFloat(costPrice) : undefined,
      supplier: supplier || undefined,
      notes: notes || undefined,
    };

    if (onSave) {
      onSave(payload);
    }
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-950 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-neutral-800 text-white">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[#E1FB15]">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Entrada de Stock</h3>
              <p className="text-[11px] text-neutral-400">Registo de entrada de mercadorias no inventário</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-400 block mb-1">
              Produto / Artigo
            </label>
            <input
              required
              type="text"
              value={productName}
              placeholder="Ex: Cerveja Cuca 330ml ou Código"
              onChange={(e) => setProductName(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#E1FB15]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-400 block mb-1">
                Quantidade
              </label>
              <input
                required
                type="number"
                min="1"
                value={quantity}
                placeholder="Ex: 50"
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#E1FB15]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-400 block mb-1">
                Custo Unitário (Kz)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={costPrice}
                placeholder="Ex: 350"
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#E1FB15]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-400 block mb-1">
              Fornecedor (Opcional)
            </label>
            <input
              type="text"
              value={supplier}
              placeholder="Ex: Distribuidora Luanda Lda"
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#E1FB15]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-400 block mb-1">
              Observações / N.º Guia
            </label>
            <input
              type="text"
              value={notes}
              placeholder="Ex: Guia de remessa GR-2026/049"
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#E1FB15]"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-semibold py-2.5 rounded-xl border border-neutral-800 text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#E1FB15] hover:bg-opacity-90 text-black font-bold py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "A registar..." : "Confirmar Entrada"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StockEntryModal;
