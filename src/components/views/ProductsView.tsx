import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  Barcode, 
  Boxes, 
  X, 
  RotateCcw, 
  Check, 
  Tag, 
  PackageOpen, 
  FilterX,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { Product, ProductStatus } from '../../types';
import { formatKz } from '../../utils/formatters';
import { StockModal } from './StockModal';
import { supabaseService } from '../../services/supabaseService';

interface ProductsViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  setProducts,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'stock_entry'>('create');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Real-time reactive search across: barcode, name, category, sku, saleType
  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      !term ||
      p.name.toLowerCase().includes(term) ||
      p.barcode.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      (p.saleType && p.saleType.toLowerCase().includes(term));
      
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesStock = !onlyLowStock || p.stock <= p.minStock;
    return matchesSearch && matchesCategory && matchesStock;
  });

  const handleOpenModal = (mode: 'create' | 'edit' | 'stock_entry', product?: Product) => {
    setModalMode(mode);
    setEditingProduct(product || null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (productPayload: Partial<Product>, isEditing: boolean) => {
    if (isEditing && editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? {
        ...p,
        ...productPayload,
      } as Product : p));
      showToast(`Artigo "${productPayload.name}" atualizado com sucesso.`);
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: productPayload.name || '',
        sku: productPayload.sku || `MSK-${Math.floor(1000 + Math.random() * 9000)}`,
        barcode: productPayload.barcode || `560${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        category: productPayload.category || 'Alimentação',
        saleType: productPayload.saleType || 'Unidade',
        costPrice: productPayload.costPrice || 0,
        salePrice: productPayload.salePrice || 0,
        stock: productPayload.stock || 0,
        minStock: productPayload.minStock || 5,
        unit: productPayload.unit || 'un',
        status: productPayload.status || 'active',
        updatedAt: new Date().toISOString().split('T')[0],
      };
      setProducts(prev => [newProd, ...prev]);
      showToast(`Entrada de estoque realizada para "${newProd.name}".`);

      // Asynchronously sync to Supabase
      supabaseService.insertProduct(newProd).catch(err => console.warn('Supabase sync:', err));
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza de que deseja eliminar o produto "${name}"?`)) {
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast(`Produto "${name}" removido do catálogo.`);
      // Asynchronously delete from Supabase
      supabaseService.deleteProduct(id).catch(err => console.warn('Supabase delete:', err));
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setOnlyLowStock(false);
  };

  const hasActiveFilters = searchTerm !== '' || selectedCategory !== 'all' || onlyLowStock;

  return (
    <div id="view-products" className="space-y-5 animate-in fade-in duration-200">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-950 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3">
          <Check size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. CABEÇALHO COM AÇÕES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-zinc-950">Gestão de Produtos & Estoque</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-700">
              {products.length} artigos
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Controle de inventário, preços de custo e margens em Kwanzas (Kz)
          </p>
        </div>

        {/* Action Buttons: "Entrada de Estoque" + Quick Circular "+" Button */}
        <div className="flex items-center gap-2.5">
          <button
            id="btn-stock-entry"
            type="button"
            onClick={() => handleOpenModal('stock_entry')}
            className="px-4 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Boxes size={16} className="text-amber-400" />
            <span>Entrada de Estoque</span>
          </button>

          <button
            id="btn-add-product-quick"
            type="button"
            onClick={() => handleOpenModal('create')}
            title="Adicionar Novo Artigo"
            className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* 2. BARRA DE PESQUISA REATIVA EM TEMPO REAL E FILTROS */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Real-time search field */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            id="search-products-reactive"
            type="text"
            placeholder="Pesquisar por código de barras, nome, categoria ou SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:border-transparent transition-all shadow-xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <select
            id="select-category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filtrar por Categoria"
            className="px-3.5 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 shadow-xs cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'Todas as Categorias' : cat}
              </option>
            ))}
          </select>

          {/* Low Stock Toggle */}
          <button
            type="button"
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
              onlyLowStock
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white border border-gray-200 text-zinc-700 hover:bg-zinc-50 shadow-xs'
            }`}
          >
            <AlertTriangle size={14} className={onlyLowStock ? 'text-white' : 'text-rose-500'} />
            <span>Stock Baixo</span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              title="Limpar todos os filtros"
              className="px-3 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <FilterX size={14} />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. TABELA ESTRUTURADA EM COLUNAS VISUAIS SEPARADAS OU FEEDBACK DE ESTADO VAZIO */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        {products.length === 0 ? (
          /* Estado Vazio Absoluto (Sem produtos cadastrados) */
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-3xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
              <PackageOpen size={32} />
            </div>
            <h3 className="font-bold text-base text-zinc-900">Catálogo de Produtos Vazio</h3>
            <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-5">
              Ainda não existem produtos ou artigos registados no seu inventário.
            </p>
            <button
              type="button"
              onClick={() => handleOpenModal('stock_entry')}
              className="px-5 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Boxes size={16} className="text-amber-400" />
              <span>Fazer Primeira Entrada de Estoque</span>
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Estado Sem Resultados de Pesquisa */
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-50 border border-gray-100 flex items-center justify-center text-zinc-400 mb-3">
              <Search size={26} />
            </div>
            <h3 className="font-bold text-sm text-zinc-900">Nenhum resultado encontrado</h3>
            <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-4">
              Não encontramos nenhum artigo correspondente aos critérios de busca aplicados.
            </p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Redefinir Filtros</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-gray-100 text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Código de Barras</th>
                  <th className="py-3.5 px-4">Nome do Produto</th>
                  <th className="py-3.5 px-4">Categoria</th>
                  <th className="py-3.5 px-4 text-center">Tipo de Venda</th>
                  <th className="py-3.5 px-4 text-right">Custo (Kz)</th>
                  <th className="py-3.5 px-4 text-right">Venda (Kz)</th>
                  <th className="py-3.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => {
                  const isLow = p.stock <= p.minStock;
                  const isOut = p.stock === 0;
                  const margin = p.salePrice > 0 ? (((p.salePrice - p.costPrice) / p.salePrice) * 100).toFixed(0) : '0';
                  const saleTypeLabel = p.saleType || (p.unit === 'cx' ? 'Caixa (cx)' : p.unit === 'kg' ? 'Quilograma (kg)' : p.unit === 'pct' ? 'Pacote (pct)' : 'Unidade (un)');

                  return (
                    <tr key={p.id} className="hover:bg-zinc-50/70 transition-colors group">
                      {/* COLUNA 1: Código de Barras */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-700 group-hover:bg-zinc-200 transition-colors">
                            <Barcode size={16} />
                          </div>
                          <span className="font-mono text-xs font-semibold text-zinc-800 tracking-wide">
                            {p.barcode}
                          </span>
                        </div>
                      </td>

                      {/* COLUNA 2: Nome */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-950 text-sm">{p.name}</div>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                          <span className="font-medium text-zinc-500">SKU: {p.sku}</span>
                          <span>•</span>
                          <span className={`font-semibold ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-700'}`}>
                            {p.stock} {p.unit} em estoque
                          </span>
                        </div>
                      </td>

                      {/* COLUNA 3: Categoria */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 text-zinc-800 font-medium text-[11px]">
                          <Tag size={11} className="text-zinc-400" />
                          <span>{p.category}</span>
                        </span>
                      </td>

                      {/* COLUNA 4: Tipo de venda */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full bg-zinc-50 border border-gray-200 text-zinc-700 font-semibold text-[11px]">
                          {saleTypeLabel}
                        </span>
                      </td>

                      {/* COLUNA 5: Custo (Kz) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-semibold text-zinc-600 text-xs">
                          {formatKz(p.costPrice)}
                        </span>
                      </td>

                      {/* COLUNA 6: Venda (Kz) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-bold text-zinc-950 text-sm">
                          {formatKz(p.salePrice)}
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-600 block">
                          +{margin}% margem
                        </span>
                      </td>

                      {/* COLUNA 7: Ações (Editar / Excluir) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenModal('edit', p)}
                            className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
                            title="Editar Artigo"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 rounded-xl hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Excluir Artigo"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. MODAL MODULAR DE ENTRADA DE ESTOQUE */}
      <StockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={editingProduct}
        mode={modalMode}
      />
    </div>
  );
};
