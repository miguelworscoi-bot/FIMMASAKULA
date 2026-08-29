import React, { useState, useMemo } from 'react';
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
  Calendar,
  CalendarX,
  Hourglass,
  Wallet,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Lock,
  Eye,
  ShieldCheck,
  Printer
} from 'lucide-react';
import { Product, ProductStatus } from '../../types';
import { formatKz } from '../../utils/formatters';
import { StockModal } from './StockModal';
import { supabaseService } from '../../services/supabaseService';
import { useAuth } from '../../contexts/AuthContext';
import { PermissionMatrixModal } from '../auth/PermissionMatrixModal';
import { ProductLabelPrintModal } from '../ProductLabelPrintModal';

interface ProductsViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  setProducts,
}) => {
  const { hasRole, profile } = useAuth();
  const isManager = hasRole(['GERENTE']);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeQuickFilter, setActiveQuickFilter] = useState<'all' | 'lowStock' | 'expiring'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'stock_entry'>('stock_entry');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [printingLabelProduct, setPrintingLabelProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [restrictedActionAlert, setRestrictedActionAlert] = useState<string | null>(null);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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

  // Helper: Format Date to DD/MM/YYYY
  const formatDateDisplay = (dateStr?: string): string => {
    if (!dateStr) return 'Sem validade';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  // Metrics Calculation
  const metrics = useMemo(() => {
    let totalItems = 0;
    let lowStockCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;
    let totalValue = 0;

    products.forEach(p => {
      totalItems += p.stock;
      totalValue += (p.stock * p.salePrice);

      if (p.stock <= p.minStock) {
        lowStockCount++;
      }

      const days = getDaysToExpiry(p.expirationDate);
      if (days !== null) {
        if (days <= 0) {
          expiredCount++;
        } else if (days <= 30) {
          expiringCount++;
        }
      }
    });

    return {
      totalItems,
      lowStockCount,
      expiringCount,
      expiredCount,
      totalExpiringAlerts: expiringCount + expiredCount,
      totalValue
    };
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = 
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.barcode.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        (p.batch && p.batch.toLowerCase().includes(term)) ||
        (p.supplier && p.supplier.toLowerCase().includes(term)) ||
        (p.notes && p.notes.toLowerCase().includes(term));
        
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

      let matchesQuickFilter = true;
      if (activeQuickFilter === 'lowStock') {
        matchesQuickFilter = p.stock <= p.minStock;
      } else if (activeQuickFilter === 'expiring') {
        const days = getDaysToExpiry(p.expirationDate);
        matchesQuickFilter = days !== null && days <= 30;
      }

      return matchesSearch && matchesCategory && matchesQuickFilter;
    });
  }, [products, searchTerm, selectedCategory, activeQuickFilter]);

  const handleOpenModal = (mode: 'create' | 'edit' | 'stock_entry', product?: Product) => {
    if (!isManager) {
      setRestrictedActionAlert(
        mode === 'edit'
          ? 'Alteração de preços e dados de produtos requer perfil GERENTE. O Operador de Caixa possui acesso em modo Apenas Leitura.'
          : 'Entrada e ajuste de estoque são restritos ao perfil GERENTE conforme a Matriz de Permissões.'
      );
      return;
    }
    setModalMode(mode);
    setEditingProduct(product || null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (productPayload: Partial<Product>, isEditing: boolean) => {
    if (!isManager) {
      setRestrictedActionAlert('Operação de cadastro/ajuste de estoque restrita a Gerente.');
      return;
    }

    if (isEditing && editingProduct) {
      const updated: Product = {
        ...editingProduct,
        ...productPayload,
      } as Product;

      setProducts(prev => prev.map(p => p.id === editingProduct.id ? updated : p));
      showToast(`Entrada/Artigo "${productPayload.name}" atualizado com sucesso.`);
      supabaseService.insertProduct(updated).catch(err => console.warn('Supabase sync:', err));
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: productPayload.name || '',
        sku: productPayload.sku || `MSK-${Math.floor(1000 + Math.random() * 9000)}`,
        barcode: productPayload.barcode || `560${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        category: productPayload.category || 'Medicamentos',
        saleType: productPayload.saleType || 'Unidade',
        supplier: productPayload.supplier || '',
        batch: productPayload.batch || '',
        expirationDate: productPayload.expirationDate || '',
        notes: productPayload.notes || '',
        costPrice: productPayload.costPrice || 0,
        salePrice: productPayload.salePrice || 0,
        stock: productPayload.stock || 0,
        minStock: productPayload.minStock !== undefined ? productPayload.minStock : 5,
        unit: productPayload.unit || 'un',
        status: productPayload.status || 'active',
        updatedAt: new Date().toISOString().split('T')[0],
      };

      setProducts(prev => [newProd, ...prev]);
      showToast(`Nova entrada de estoque registrada para "${newProd.name}".`);
      supabaseService.insertProduct(newProd).catch(err => console.warn('Supabase sync:', err));
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!isManager) {
      setRestrictedActionAlert('Remoção de artigos e baixas de estoque requerem perfil GERENTE.');
      return;
    }
    if (window.confirm(`Tem certeza de que deseja remover esta entrada/artigo "${name}" do estoque?`)) {
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast(`Item "${name}" removido do estoque.`);
      supabaseService.deleteProduct(id).catch(err => console.warn('Supabase delete:', err));
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setActiveQuickFilter('all');
  };

  const hasActiveFilters = searchTerm !== '' || selectedCategory !== 'all' || activeQuickFilter !== 'all';

  return (
    <div id="view-products" className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-950 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3">
          <Check size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. CABEÇALHO COM AÇÕES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-zinc-950 text-white">
            <Boxes size={22} className="text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-950">Gestão de Estoque & Validade</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-700">
                {products.length} lotes/artigos
              </span>
              {!isManager && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                  <Eye size={12} />
                  <span>Modo Apenas Leitura (Caixa)</span>
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isManager 
                ? 'Controle total de lotes, novas entradas, cadastro de artigos e tabelas de preços em Kz' 
                : 'Consulta de disponibilidade, códigos de barras, validades e preços para atendimento ao cliente'}
            </p>
          </div>
        </div>

        {/* Botão de Ação Primária: Nova Entrada de Estoque */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMatrixOpen(true)}
            className="px-3.5 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ShieldCheck size={15} className="text-emerald-600" />
            <span className="hidden sm:inline">Matriz de Permissões</span>
          </button>

          <button
            id="btn-new-stock-entry"
            type="button"
            onClick={() => handleOpenModal('stock_entry')}
            className={`px-5 py-2.5 rounded-2xl font-semibold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
              isManager
                ? 'bg-zinc-950 hover:bg-zinc-800 text-white'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border border-gray-200'
            }`}
          >
            {isManager ? (
              <>
                <Plus size={16} className="text-amber-400" />
                <span>Nova Entrada de Estoque</span>
              </>
            ) : (
              <>
                <Lock size={14} className="text-amber-600" />
                <span>Entrada (Requer Gerente)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. CARDS DE MÉTRICAS PRINCIPAIS (KEY METRICS CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Itens */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-400">Total de Itens em Estoque</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-zinc-950">{metrics.totalItems.toLocaleString('pt-AO')}</span>
              <span className="text-xs text-zinc-400 font-medium">unidades</span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Boxes size={20} />
          </div>
        </div>

        {/* Abaixo da Qtd Mínima */}
        <div 
          onClick={() => setActiveQuickFilter('lowStock')}
          className={`bg-white rounded-3xl p-5 border shadow-xs flex items-center justify-between cursor-pointer transition-all hover:border-amber-300 ${
            activeQuickFilter === 'lowStock' ? 'ring-2 ring-amber-500 border-amber-400' : 'border-gray-100'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-zinc-400">Abaixo da Qtd Mínima</p>
              <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded-md border border-amber-200">
                Alerta
              </span>
            </div>
            <p className="text-2xl font-black text-amber-600 mt-1">{metrics.lowStockCount}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <AlertTriangle size={20} />
          </div>
        </div>

        {/* Vencimento Próximo */}
        <div 
          onClick={() => setActiveQuickFilter('expiring')}
          className={`bg-white rounded-3xl p-5 border shadow-xs flex items-center justify-between cursor-pointer transition-all hover:border-rose-300 ${
            activeQuickFilter === 'expiring' ? 'ring-2 ring-rose-500 border-rose-400' : 'border-gray-100'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-zinc-400">Vencimento Próximo</p>
              <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-1.5 py-0.5 rounded-md border border-rose-200">
                ≤ 30 dias
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-rose-600">{metrics.totalExpiringAlerts}</span>
              {metrics.expiredCount > 0 && (
                <span className="text-[11px] font-bold text-rose-500">
                  ({metrics.expiredCount} vencidos)
                </span>
              )}
            </div>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <Hourglass size={20} />
          </div>
        </div>

        {/* Valor Total do Estoque */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-400">Valor Total do Estoque</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{formatKz(metrics.totalValue)}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Wallet size={20} />
          </div>
        </div>
      </div>

      {/* 3. BARRA DE PESQUISA REATIVA E FILTROS */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Campo de Busca em tempo real */}
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            id="search-inventory-reactive"
            type="text"
            placeholder="Buscar por produto, lote, fornecedor, SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-xs text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:border-transparent transition-all"
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

        {/* Abas de Filtro e Seletores */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setActiveQuickFilter('all')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition cursor-pointer ${
              activeQuickFilter === 'all'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            Todos ({products.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveQuickFilter('lowStock')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              activeQuickFilter === 'lowStock'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            <AlertTriangle size={13} className={activeQuickFilter === 'lowStock' ? 'text-white' : 'text-amber-500'} />
            <span>Abaixo do Mínimo ({metrics.lowStockCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveQuickFilter('expiring')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              activeQuickFilter === 'expiring'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            <CalendarX size={13} className={activeQuickFilter === 'expiring' ? 'text-white' : 'text-rose-500'} />
            <span>Alerta Validade ({metrics.totalExpiringAlerts})</span>
          </button>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-100 text-xs font-semibold text-zinc-800 border-none focus:ring-2 focus:ring-zinc-950 cursor-pointer shrink-0"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'Todas Categorias' : cat}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              title="Limpar todos os filtros"
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
            >
              <FilterX size={15} />
            </button>
          )}
        </div>
      </div>

      {/* 4. TABELA DE ESTOQUE ATUALIZADA (INVENTORY TABLE) */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        {products.length === 0 ? (
          /* Estado Vazio Absoluto */
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-3xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
              <PackageOpen size={32} />
            </div>
            <h3 className="font-bold text-base text-zinc-900">Estoque Vazio</h3>
            <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-5">
              Ainda não existem entradas registradas no inventário.
            </p>
            <button
              type="button"
              onClick={() => handleOpenModal('stock_entry')}
              className="px-5 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={16} className="text-amber-400" />
              <span>Registrar Primeira Entrada de Estoque</span>
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Estado Sem Resultados de Pesquisa */
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-50 border border-gray-100 flex items-center justify-center text-zinc-400 mb-3">
              <Search size={26} />
            </div>
            <h3 className="font-bold text-sm text-zinc-900">Nenhum item encontrado</h3>
            <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-4">
              Nenhum lote ou produto corresponde aos filtros e buscas selecionados.
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
                <tr className="bg-zinc-50/90 border-b border-gray-100 text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Produto / SKU</th>
                  <th className="py-3.5 px-4">Lote / Fornecedor</th>
                  <th className="py-3.5 px-4 text-center">Qtd Atual</th>
                  <th className="py-3.5 px-4 text-center">Qtd Mínima</th>
                  <th className="py-3.5 px-4">Data de Validade</th>
                  <th className="py-3.5 px-4 text-right">Preço Un. (Kz)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => {
                  const isLowStock = p.stock <= p.minStock;
                  const isOutOfStock = p.stock === 0;
                  const daysToExpiry = getDaysToExpiry(p.expirationDate);
                  const isExpired = daysToExpiry !== null && daysToExpiry <= 0;
                  const isExpiringSoon = daysToExpiry !== null && daysToExpiry > 0 && daysToExpiry <= 30;

                  // Status Badge Logic
                  let statusBadge = null;
                  if (isExpired) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        <XCircle size={12} className="text-rose-600" />
                        <span>Vencido</span>
                      </span>
                    );
                  } else if (isExpiringSoon) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        <Clock size={12} className="text-amber-600" />
                        <span>Vence em {daysToExpiry}d</span>
                      </span>
                    );
                  } else if (isOutOfStock) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        <XCircle size={12} className="text-rose-600" />
                        <span>Esgotado</span>
                      </span>
                    );
                  } else if (isLowStock) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        <AlertTriangle size={12} className="text-amber-600" />
                        <span>Est. Baixo</span>
                      </span>
                    );
                  } else {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        <span>Normal</span>
                      </span>
                    );
                  }

                  return (
                    <tr key={p.id} className="hover:bg-zinc-50/70 transition-colors group">
                      {/* COLUNA 1: Produto / SKU */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-950 text-sm">{p.name}</div>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                          <span className="font-mono text-zinc-600 font-semibold">{p.sku}</span>
                          <span>•</span>
                          <span className="text-zinc-500">{p.category}</span>
                          {p.barcode && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-[10px] text-zinc-400">{p.barcode}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* COLUNA 2: Lote / Fornecedor / Localização */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-zinc-800 text-xs">
                          {p.supplier || 'Fornecedor padrão'}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                          {p.batch && (
                            <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded">
                              {p.batch}
                            </span>
                          )}
                          {p.notes && (
                            <span className="text-zinc-500 flex items-center gap-0.5">
                              <MapPin size={10} className="text-zinc-400" />
                              {p.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* COLUNA 3: Qtd Atual */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`font-black text-sm ${isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-zinc-950'}`}>
                          {p.stock} {p.unit}
                        </span>
                      </td>

                      {/* COLUNA 4: Qtd Mínima */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-block bg-zinc-100 border border-gray-200 px-2.5 py-0.5 rounded-lg font-mono text-xs font-bold text-zinc-700">
                          {p.minStock} {p.unit}
                        </span>
                      </td>

                      {/* COLUNA 5: Data de Validade */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className={`font-mono text-xs font-semibold ${
                          isExpired ? 'text-rose-600 font-bold' : isExpiringSoon ? 'text-amber-600 font-bold' : 'text-zinc-700'
                        }`}>
                          {formatDateDisplay(p.expirationDate)}
                        </div>
                        {daysToExpiry !== null && (
                          <div className="text-[10px] text-zinc-400">
                            {daysToExpiry < 0 
                              ? `Expirou há ${Math.abs(daysToExpiry)} dias` 
                              : daysToExpiry === 0 
                              ? 'Expira hoje!' 
                              : `${daysToExpiry} dias restantes`}
                          </div>
                        )}
                      </td>

                      {/* COLUNA 6: Preço Unitário (Kz) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-bold text-zinc-950 text-xs">
                          {formatKz(p.salePrice)}
                        </div>
                        {p.costPrice > 0 && (
                          <div className="text-[10px] text-zinc-400">
                            Custo: {formatKz(p.costPrice)}
                          </div>
                        )}
                      </td>

                      {/* COLUNA 7: Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {statusBadge}
                      </td>

                      {/* COLUNA 8: Ações */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPrintingLabelProduct(p)}
                            className="p-2 rounded-xl transition-colors text-zinc-500 hover:text-black hover:bg-zinc-100 cursor-pointer"
                            title="Imprimir Etiquetas / Código de Barras"
                          >
                            <Printer size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenModal('edit', p)}
                            className={`p-2 rounded-xl transition-colors cursor-pointer ${
                              isManager 
                                ? 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100' 
                                : 'text-zinc-300 hover:text-amber-700 hover:bg-amber-50'
                            }`}
                            title={isManager ? "Editar Artigo / Preço" : "Apenas Consulta (Requer Gerente para editar)"}
                          >
                            {isManager ? <Edit size={15} /> : <Lock size={14} className="text-zinc-400" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className={`p-2 rounded-xl transition-colors cursor-pointer ${
                              isManager
                                ? 'text-zinc-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-zinc-300 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title={isManager ? "Excluir Entrada" : "Apenas Consulta (Requer Gerente para excluir)"}
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

      {/* 5. MODAL DE ENTRADA DE ESTOQUE */}
      <StockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={editingProduct}
        mode={modalMode}
      />

      {/* Modal de Alerta de Ação Restrita da Matriz */}
      {restrictedActionAlert && (
        <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150 text-xs text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <Lock size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-zinc-950">Ação Restrita a Gerente</h3>
              <p className="text-zinc-500 text-xs">
                {restrictedActionAlert}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-50 border border-gray-200 text-left text-[11px] text-zinc-600 space-y-1">
              <p className="font-bold text-zinc-800">Matriz de Permissões Masakula:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-zinc-500">
                <li><strong>Consulta de Estoque:</strong> Caixa (👁️ Apenas Leitura)</li>
                <li><strong>Entrada / Ajuste / Preços:</strong> Gerente (✅ Permissão Total)</li>
              </ul>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRestrictedActionAlert(null);
                  setIsMatrixOpen(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold cursor-pointer"
              >
                Ver Matriz de Acessos
              </button>
              <button
                type="button"
                onClick={() => setRestrictedActionAlert(null)}
                className="px-5 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Matrix Modal */}
      <PermissionMatrixModal
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
      />

      {/* Modal de Impressão de Etiquetas */}
      <ProductLabelPrintModal
        product={printingLabelProduct ? {
          name: printingLabelProduct.name,
          price: printingLabelProduct.salePrice,
          code: printingLabelProduct.barcode || printingLabelProduct.code || `MSK-${printingLabelProduct.id.slice(0, 6)}`
        } : null}
        isOpen={!!printingLabelProduct}
        onClose={() => setPrintingLabelProduct(null)}
      />
    </div>
  );
};
