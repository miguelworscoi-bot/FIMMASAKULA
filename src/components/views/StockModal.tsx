import React, { useState, useEffect } from 'react';
import { 
  X, 
  Barcode, 
  Sparkles, 
  Boxes, 
  DollarSign, 
  Tag, 
  Layers, 
  AlertCircle, 
  Check, 
  Percent 
} from 'lucide-react';
import { Product, ProductStatus } from '../../types';
import { formatKz } from '../../utils/formatters';

interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Product>, isEditing: boolean) => void;
  productToEdit?: Product | null;
  mode?: 'create' | 'edit' | 'stock_entry';
}

export const StockModal: React.FC<StockModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  mode = 'stock_entry',
}) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'Informática & Laptops',
    saleType: 'Unidade (un)',
    costPrice: '',
    salePrice: '',
    stock: '10',
    minStock: '5',
    unit: 'un',
  });

  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name,
        sku: productToEdit.sku,
        barcode: productToEdit.barcode,
        category: productToEdit.category,
        saleType: productToEdit.saleType || 'Unidade (un)',
        costPrice: productToEdit.costPrice.toString(),
        salePrice: productToEdit.salePrice.toString(),
        stock: productToEdit.stock.toString(),
        minStock: productToEdit.minStock.toString(),
        unit: productToEdit.unit || 'un',
      });
    } else {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const randomBarcode = `560${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const randomSku = `MSK-${randomSuffix}`;
      setFormData({
        name: '',
        sku: randomSku,
        barcode: randomBarcode,
        category: 'Informática & Laptops',
        saleType: 'Unidade (un)',
        costPrice: '',
        salePrice: '',
        stock: '10',
        minStock: '5',
        unit: 'un',
      });
    }
    setValidationErrors({});
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const generateAutomaticCodes = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const randomBarcode = `560${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const randomSku = `MSK-${randomSuffix}`;
    setFormData(prev => ({
      ...prev,
      sku: randomSku,
      barcode: randomBarcode,
    }));
  };

  const validate = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'O nome do produto é obrigatório.';
    }
    if (!formData.barcode.trim()) {
      errors.barcode = 'O código de barras é obrigatório.';
    }
    const cost = parseFloat(formData.costPrice);
    if (isNaN(cost) || cost < 0) {
      errors.costPrice = 'Insira um preço de custo válido (≥ 0 Kz).';
    }
    const sale = parseFloat(formData.salePrice);
    if (isNaN(sale) || sale <= 0) {
      errors.salePrice = 'Insira um preço de venda válido (> 0 Kz).';
    } else if (!isNaN(cost) && sale < cost) {
      errors.salePrice = 'Aviso: Preço de venda inferior ao custo.';
    }
    const stockQty = parseInt(formData.stock);
    if (isNaN(stockQty) || stockQty < 0) {
      errors.stock = 'Quantidade de estoque inválida.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0 || (Object.keys(errors).length === 1 && errors.salePrice?.startsWith('Aviso'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const cost = parseFloat(formData.costPrice) || 0;
    const sale = parseFloat(formData.salePrice) || 0;
    const stockQty = parseInt(formData.stock) || 0;
    const minQty = parseInt(formData.minStock) || 0;

    let status: ProductStatus = 'active';
    if (stockQty === 0) status = 'out_of_stock';
    else if (stockQty <= minQty) status = 'low_stock';

    const productPayload: Partial<Product> = {
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      barcode: formData.barcode.trim(),
      category: formData.category,
      saleType: formData.saleType,
      costPrice: cost,
      salePrice: sale,
      stock: stockQty,
      minStock: minQty,
      unit: formData.unit,
      status,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSave(productPayload, !!productToEdit);
    onClose();
  };

  // Live Profit Margin Calculation
  const costNum = parseFloat(formData.costPrice) || 0;
  const saleNum = parseFloat(formData.salePrice) || 0;
  const profitKz = saleNum - costNum;
  const marginPercent = saleNum > 0 ? ((profitKz / saleNum) * 100).toFixed(1) : '0';

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-zinc-950 text-white">
                <Boxes size={18} className="text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-zinc-950">
                  {mode === 'stock_entry' 
                    ? 'Entrada de Estoque' 
                    : productToEdit 
                    ? 'Editar Artigo' 
                    : 'Novo Artigo / Produto'}
                </h3>
                <p className="text-xs text-zinc-400">
                  Registro de artigos com controle de custo, margem e código em Kwanzas (Kz)
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Nome do Produto */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-zinc-700">Nome do Produto / Descrição</label>
              {validationErrors.name && (
                <span className="text-[10px] font-semibold text-rose-500">{validationErrors.name}</span>
              )}
            </div>
            <input
              type="text"
              required
              placeholder="Ex: Teclado Mecânico RGB Wireless, Monitor IPS 24..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none transition-all ${
                validationErrors.name ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
              }`}
            />
          </div>

          {/* Código de Barras & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-zinc-700">Código de Barras</label>
                <button
                  type="button"
                  onClick={generateAutomaticCodes}
                  className="text-[10px] text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 cursor-pointer"
                  title="Gerar código aleatório EAN-13"
                >
                  <Sparkles size={11} />
                  <span>Gerar Auto</span>
                </button>
              </div>
              <div className="relative">
                <Barcode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  required
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Ex: 560123456789"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-mono text-xs focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Código SKU / Referência</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Ex: MSK-4920"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-mono text-xs focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
              />
            </div>
          </div>

          {/* Categoria & Tipo de Venda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Categoria</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-medium focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none cursor-pointer"
              >
                <option value="Alimentação">Alimentação</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Limpeza">Limpeza</option>
                <option value="Informática & Laptops">Informática & Laptops</option>
                <option value="Smartphones & Tablets">Smartphones & Tablets</option>
                <option value="Equipamento PDV">Equipamento PDV</option>
                <option value="Consumíveis & Papelaria">Consumíveis & Papelaria</option>
                <option value="Redes & Conectividade">Redes & Conectividade</option>
                <option value="Serviços Técnicos">Serviços Técnicos</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Tipo de venda</label>
              <select
                value={formData.saleType}
                onChange={(e) => {
                  const val = e.target.value;
                  let unit = 'un';
                  if (val.includes('cx') || val === 'Caixa') unit = 'cx';
                  else if (val.includes('kg') || val === 'Quilo') unit = 'kg';
                  else if (val.includes('pct') || val === 'Pacote') unit = 'pct';
                  setFormData({ ...formData, saleType: val, unit });
                }}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 font-medium focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none cursor-pointer"
              >
                <option value="Unidade">Unidade</option>
                <option value="Quilo">Quilo</option>
                <option value="Caixa">Caixa</option>
                <option value="Pacote">Pacote</option>
                <option value="Serviço / Hora">Serviço / Hora</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          {/* Preços: Custo (Kz) & Venda (Kz) com Calculador de Margem */}
          <div className="p-3.5 bg-zinc-50 rounded-2xl border border-gray-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">Preço de Custo (Kz)</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="Ex: 50000"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-gray-200 text-zinc-900 focus:ring-2 focus:ring-zinc-950 focus:outline-none font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700">Preço de Venda (Kz)</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="Ex: 75000"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-gray-200 text-zinc-900 font-bold focus:ring-2 focus:ring-zinc-950 focus:outline-none"
                />
              </div>
            </div>

            {/* Painel de Rentabilidade em Tempo Real */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-xs">
              <div className="flex items-center gap-1.5 text-zinc-600">
                <Percent size={13} className="text-emerald-600" />
                <span>Margem de Lucro Bruta:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-xs ${parseFloat(marginPercent) < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {marginPercent}%
                </span>
                <span className="text-[11px] text-zinc-400">({formatKz(profitKz)} / un)</span>
              </div>
            </div>
          </div>

          {/* Quantidades e Estoque Mínimo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">
                {mode === 'stock_entry' ? 'Quantidade a Inserir' : 'Estoque Atual'}
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-zinc-700">Estoque Mínimo (Alerta)</label>
              <input
                type="number"
                required
                min="1"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-zinc-900 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
              />
            </div>
          </div>

          {/* Botões do Rodapé */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-gray-200 text-zinc-700 hover:bg-zinc-50 font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Check size={16} className="text-emerald-400" />
              <span>{productToEdit ? 'Atualizar Artigo' : 'Salvar no Estoque'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
