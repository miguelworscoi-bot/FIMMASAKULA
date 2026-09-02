import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
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
  Printer,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  LayoutGrid,
  List,
  Download,
  ArrowUpDown,
  SlidersHorizontal,
  ChevronDown,
  RefreshCw,
  Copy,
  FolderTree
} from 'lucide-react';
import { Product, ProductStatus } from '../../types';
import { formatKz } from '../../utils/formatters';
import { supabaseService } from '../../services/supabaseService';
import { useAuth } from '../../contexts/AuthContext';
import { PermissionMatrixModal } from '../auth/PermissionMatrixModal';
import { ProductLabelPrintModal } from '../ProductLabelPrintModal';
import { InventoryProductCard } from '../inventory/InventoryProductCard';
import { InventoryDetailDrawer } from '../inventory/InventoryDetailDrawer';
import { InventoryEditModal } from '../inventory/InventoryEditModal';
import { InventoryQuickStockModal } from '../inventory/InventoryQuickStockModal';
import { InventoryBatchBar } from '../inventory/InventoryBatchBar';
import { exportInventoryToExcel } from '../../utils/exportInventory';
import { CategoriesSubscreenPage } from '../CategoriesSubscreenPage';

interface ProductsViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export interface StockToast {
  id: string;
  type: 'critical_stock' | 'out_of_stock' | 'success' | 'warning' | 'info';
  title: string;
  message: string;
  productName?: string;
  currentStock?: number;
  minStock?: number;
  unit?: string;
  actionLabel?: string;
  onAction?: () => void;
}

type SortOption = 'name_asc' | 'name_desc' | 'stock_asc' | 'stock_desc' | 'price_desc' | 'price_asc' | 'expiry_asc';

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  setProducts,
}) => {
  const { hasRole } = useAuth();
  const isManager = hasRole(['GERENTE']);

  // Filters & View State
  const [productSubTab, setProductSubTab] = useState<'inventory' | 'categories'>('inventory');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeQuickFilter, setActiveQuickFilter] = useState<'all' | 'lowStock' | 'expiring' | 'outOfStock' | 'highMargin'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');

  // Multi-Selection State
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Modals & Drawers State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalMode, setEditModalMode] = useState<'create' | 'edit'>('create');
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);

  const [isQuickStockModalOpen, setIsQuickStockModalOpen] = useState(false);
  const [printingLabelProduct, setPrintingLabelProduct] = useState<Product | null>(null);

  const [activeToasts, setActiveToasts] = useState<StockToast[]>([]);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [restrictedActionAlert, setRestrictedActionAlert] = useState<string | null>(null);
  const [copiedSkuId, setCopiedSkuId] = useState<string | null>(null);

  // Ref to track products that already triggered critical stock alert
  const initialAlertTriggeredRef = useRef(false);
  const lastKnownStockMapRef = useRef<Map<string, number>>(new Map());

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener (/ to focus search, N for new product, G for grid, T for table)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when inside inputs or textareas
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if ((e.key === 'n' || e.key === 'N') && isManager) {
        e.preventDefault();
        handleOpenCreateModal();
      } else if (e.key === 'g' || e.key === 'G') {
        setViewMode('grid');
      } else if (e.key === 't' || e.key === 'T') {
        setViewMode('table');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isManager]);

  const categories = useMemo(() => {
    return ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  }, [products]);

  const removeToast = (id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  };

  const showToast = (
    message: string, 
    type: 'success' | 'info' | 'warning' = 'success',
    title?: string
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: StockToast = {
      id,
      type,
      title: title || (type === 'success' ? 'Operação Concluída' : 'Aviso'),
      message,
    };
    setActiveToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const showCriticalStockToast = (
    productName: string,
    stock: number,
    minStock: number,
    unit: string = 'un',
    targetProduct?: Product
  ) => {
    const isOut = stock <= 0;
    const id = `critical-toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: StockToast = {
      id,
      type: isOut ? 'out_of_stock' : 'critical_stock',
      title: isOut ? '🚨 Estoque Esgotado' : '⚠️ Nível Crítico de Estoque',
      message: isOut
        ? `O artigo "${productName}" esgotou completamente (0 ${unit}).`
        : `O artigo "${productName}" atingiu o nível crítico definido (${stock} de mín. ${minStock} ${unit}).`,
      productName,
      currentStock: stock,
      minStock,
      unit,
      actionLabel: isManager ? 'Repor Estoque' : 'Ver na Lista',
      onAction: () => {
        if (targetProduct) {
          handleViewDetails(targetProduct);
        } else {
          setActiveQuickFilter('lowStock');
          setSearchTerm(productName);
        }
        removeToast(id);
      }
    };

    setActiveToasts(prev => {
      const filtered = prev.filter(t => t.productName !== productName);
      return [...filtered, newToast];
    });

    setTimeout(() => {
      removeToast(id);
    }, 7000);
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

  // Critical Stock Monitoring
  useEffect(() => {
    if (!products || products.length === 0) return;

    const criticalProducts = products.filter(p => p.stock <= p.minStock);

    if (!initialAlertTriggeredRef.current) {
      initialAlertTriggeredRef.current = true;
      products.forEach(p => lastKnownStockMapRef.current.set(p.id, p.stock));

      if (criticalProducts.length > 0) {
        if (criticalProducts.length === 1) {
          const single = criticalProducts[0];
          showCriticalStockToast(single.name, single.stock, single.minStock, single.unit || 'un', single);
        } else {
          const id = `critical-summary-${Date.now()}`;
          const summaryToast: StockToast = {
            id,
            type: 'critical_stock',
            title: '⚠️ Alerta de Estoque Crítico',
            message: `Existem ${criticalProducts.length} artigos que atingiram ou estão abaixo da quantidade mínima!`,
            actionLabel: 'Ver Artigos Críticos',
            onAction: () => {
              setActiveQuickFilter('lowStock');
              removeToast(id);
            }
          };
          setActiveToasts(prev => [...prev, summaryToast]);
          setTimeout(() => removeToast(id), 7000);
        }
      }
      return;
    }

    products.forEach(p => {
      const prevStock = lastKnownStockMapRef.current.get(p.id);
      const isNowCritical = p.stock <= p.minStock;
      const wasPreviouslyHigher = prevStock !== undefined && prevStock > p.minStock;

      if (isNowCritical && (wasPreviouslyHigher || prevStock === undefined)) {
        showCriticalStockToast(p.name, p.stock, p.minStock, p.unit || 'un', p);
      }

      lastKnownStockMapRef.current.set(p.id, p.stock);
    });
  }, [products]);

  // Metrics Calculation
  const metrics = useMemo(() => {
    let totalItems = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;
    let totalValue = 0;
    let totalCost = 0;

    products.forEach(p => {
      totalItems += p.stock;
      totalValue += (p.stock * p.salePrice);
      totalCost += (p.stock * (p.costPrice || 0));

      if (p.stock === 0) {
        outOfStockCount++;
      } else if (p.stock <= p.minStock) {
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

    const averageMargin = totalValue > 0 ? Math.round(((totalValue - totalCost) / totalValue) * 100) : 0;

    return {
      totalArticles: products.length,
      totalItems,
      lowStockCount,
      outOfStockCount,
      expiringCount,
      expiredCount,
      totalExpiringAlerts: expiringCount + expiredCount,
      totalValue,
      totalCost,
      potentialProfit: totalValue - totalCost,
      averageMargin
    };
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => {
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
        matchesQuickFilter = p.stock > 0 && p.stock <= p.minStock;
      } else if (activeQuickFilter === 'outOfStock') {
        matchesQuickFilter = p.stock <= 0;
      } else if (activeQuickFilter === 'expiring') {
        const days = getDaysToExpiry(p.expirationDate);
        matchesQuickFilter = days !== null && days <= 30;
      } else if (activeQuickFilter === 'highMargin') {
        const margin = p.salePrice > 0 ? ((p.salePrice - (p.costPrice || 0)) / p.salePrice) : 0;
        matchesQuickFilter = margin >= 0.35;
      }

      return matchesSearch && matchesCategory && matchesQuickFilter;
    });

    // Sort list
    return list.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'stock_asc':
          return a.stock - b.stock;
        case 'stock_desc':
          return b.stock - a.stock;
        case 'price_desc':
          return b.salePrice - a.salePrice;
        case 'price_asc':
          return a.salePrice - b.salePrice;
        case 'expiry_asc': {
          const daysA = getDaysToExpiry(a.expirationDate) ?? 9999;
          const daysB = getDaysToExpiry(b.expirationDate) ?? 9999;
          return daysA - daysB;
        }
        default:
          return 0;
      }
    });
  }, [products, searchTerm, selectedCategory, activeQuickFilter, sortBy]);

  // Handlers for Modals & Actions
  const handleOpenCreateModal = () => {
    if (!isManager) {
      setRestrictedActionAlert('O cadastro de novos artigos e catálogo requer perfil GERENTE.');
      return;
    }
    setEditModalMode('create');
    setProductToEdit(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    if (!isManager) {
      setRestrictedActionAlert('Alteração de preços e dados de produtos requer perfil GERENTE.');
      return;
    }
    setEditModalMode('edit');
    setProductToEdit(product);
    setIsEditModalOpen(true);
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProductForDetail(product);
    setIsDetailDrawerOpen(true);
  };

  const handleSaveProduct = async (productPayload: Partial<Product>, isEditing: boolean) => {
    if (!isManager) {
      setRestrictedActionAlert('Operação restrita a Gerente.');
      return;
    }

    if (isEditing && productToEdit) {
      const updated: Product = {
        ...productToEdit,
        ...productPayload,
      } as Product;

      setProducts(prev => prev.map(p => p.id === productToEdit.id ? updated : p));
      
      if (selectedProductForDetail?.id === productToEdit.id) {
        setSelectedProductForDetail(updated);
      }

      showToast(`Artigo "${updated.name}" atualizado com sucesso.`);
      supabaseService.insertProduct(updated).catch(err => console.warn('Supabase sync:', err));
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: productPayload.name || 'Novo Artigo',
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
        imageUrl: productPayload.imageUrl || '',
        updatedAt: new Date().toISOString().split('T')[0],
      };

      setProducts(prev => [newProd, ...prev]);
      showToast(`Novo artigo "${newProd.name}" cadastrado.`);
      supabaseService.insertProduct(newProd).catch(err => console.warn('Supabase sync:', err));
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!isManager) {
      setRestrictedActionAlert('Remoção de artigos requer perfil GERENTE.');
      return;
    }
    if (window.confirm(`Tem certeza de que deseja excluir o produto "${name}" do catálogo?`)) {
      setProducts(prev => prev.filter(p => p.id !== id));
      if (selectedProductForDetail?.id === id) {
        setIsDetailDrawerOpen(false);
      }
      setSelectedProductIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      showToast(`Item "${name}" removido do catálogo.`);
      supabaseService.deleteProduct(id).catch(err => console.warn('Supabase delete:', err));
    }
  };

  const handleQuickStockAdjust = (product: Product, delta: number) => {
    if (!isManager) {
      setRestrictedActionAlert('Ajuste de estoque requer perfil GERENTE.');
      return;
    }

    const newStock = Math.max(0, product.stock + delta);
    const updated: Product = {
      ...product,
      stock: newStock,
      status: newStock === 0 ? 'out_of_stock' : newStock <= product.minStock ? 'low_stock' : 'active',
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setProducts(prev => prev.map(p => p.id === product.id ? updated : p));
    if (selectedProductForDetail?.id === product.id) {
      setSelectedProductForDetail(updated);
    }

    showToast(
      delta > 0 
        ? `+${delta} ${product.unit} adicionado a "${product.name}". (Total: ${newStock})` 
        : `-${Math.abs(delta)} ${product.unit} retirado de "${product.name}". (Total: ${newStock})`,
      'info'
    );
    supabaseService.insertProduct(updated).catch(err => console.warn('Supabase sync:', err));
  };

  const handleDrawerStockAdjust = (product: Product, newStock: number, reason: string) => {
    if (!isManager) {
      setRestrictedActionAlert('Ajuste de estoque requer perfil GERENTE.');
      return;
    }

    const diff = newStock - product.stock;
    const updated: Product = {
      ...product,
      stock: newStock,
      status: newStock === 0 ? 'out_of_stock' : newStock <= product.minStock ? 'low_stock' : 'active',
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setProducts(prev => prev.map(p => p.id === product.id ? updated : p));
    setSelectedProductForDetail(updated);

    showToast(`Estoque de "${product.name}" atualizado para ${newStock} (${reason}).`);
    supabaseService.insertProduct(updated).catch(err => console.warn('Supabase sync:', err));
  };

  const handleApplyQuickStockEntry = (
    productId: string, 
    qtyAdded: number, 
    reason: string, 
    newSupplier?: string, 
    newBatch?: string
  ) => {
    const target = products.find(p => p.id === productId);
    if (!target) return;

    const newStock = target.stock + qtyAdded;
    const updated: Product = {
      ...target,
      stock: newStock,
      supplier: newSupplier || target.supplier,
      batch: newBatch || target.batch,
      status: newStock <= target.minStock ? 'low_stock' : 'active',
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setProducts(prev => prev.map(p => p.id === productId ? updated : p));
    showToast(`Entrada de +${qtyAdded} ${target.unit} confirmada para "${target.name}".`);
    supabaseService.insertProduct(updated).catch(err => console.warn('Supabase sync:', err));
  };

  // Multi-select handlers
  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedProductIds(new Set(filteredProducts.map(p => p.id)));
  };

  const handleClearSelection = () => {
    setSelectedProductIds(new Set());
  };

  const handleBatchPrintLabels = () => {
    const selectedList = products.filter(p => selectedProductIds.has(p.id));
    if (selectedList.length > 0) {
      setPrintingLabelProduct(selectedList[0]);
      showToast(`Preparando etiquetas para ${selectedList.length} artigos.`);
    }
  };

  const handleBatchExport = () => {
    const selectedList = products.filter(p => selectedProductIds.has(p.id));
    exportInventoryToExcel(selectedList.length > 0 ? selectedList : filteredProducts);
    showToast(`Inventário exportado com sucesso para Excel.`);
  };

  const handleCopySku = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSkuId(id);
    setTimeout(() => setCopiedSkuId(null), 1800);
  };

  const hasActiveFilters = searchTerm !== '' || selectedCategory !== 'all' || activeQuickFilter !== 'all';

  return (
    <div id="view-products" className="space-y-6 animate-in fade-in duration-200 relative pb-16">
      
      {/* Toast Notification Container */}
      <div 
        id="products-toast-container" 
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        {activeToasts.map((toast) => {
          const isCritical = toast.type === 'critical_stock' || toast.type === 'out_of_stock';
          const isSuccess = toast.type === 'success';

          return (
            <div
              key={toast.id}
              id={`toast-${toast.id}`}
              className={`pointer-events-auto rounded-3xl p-4 shadow-2xl border transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-2.5 bg-zinc-950/95 backdrop-blur-md ${
                toast.type === 'out_of_stock'
                  ? 'text-white border-rose-800 shadow-rose-950/50'
                  : isCritical
                  ? 'text-white border-amber-800 shadow-amber-950/50'
                  : isSuccess
                  ? 'text-white border-emerald-800 shadow-emerald-950/40'
                  : 'text-white border-zinc-800 shadow-zinc-950/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-2xl shrink-0 mt-0.5 ${
                    toast.type === 'out_of_stock'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : isCritical
                      ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                      : isSuccess
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {toast.type === 'out_of_stock' ? (
                      <AlertOctagon size={18} />
                    ) : isCritical ? (
                      <AlertTriangle size={18} />
                    ) : isSuccess ? (
                      <Check size={18} />
                    ) : (
                      <Boxes size={18} />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">
                        {toast.title}
                      </span>
                      {isCritical && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          toast.type === 'out_of_stock'
                            ? 'bg-rose-500 text-white'
                            : 'bg-amber-400 text-black'
                        }`}>
                          {toast.type === 'out_of_stock' ? 'Zero Estoque' : 'Crítico'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {toast.message}
                    </p>
                    {toast.currentStock !== undefined && toast.minStock !== undefined && (
                      <div className="flex items-center gap-2 pt-1 font-mono text-[11px]">
                        <span className="bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded-lg text-amber-300">
                          Estoque: {toast.currentStock} {toast.unit}
                        </span>
                        <span className="text-zinc-500">
                          Mín: {toast.minStock} {toast.unit}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                >
                  <X size={14} />
                </button>
              </div>

              {toast.onAction && toast.actionLabel && (
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={toast.onAction}
                    className="px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer bg-[#E1FB15] hover:bg-[#d6f00f] text-black shadow-md"
                  >
                    <span>{toast.actionLabel}</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 1. TOP HEADER & ACTION BAR */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-xs">
            <Boxes size={24} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-black text-zinc-900 tracking-tight">Gestão Inteligente de Produtos & Inventário</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                {products.length} artigos cadastrados
              </span>
              {!isManager && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <Eye size={12} />
                  <span>Apenas Consulta (Caixa)</span>
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isManager 
                ? 'Controle unificado de preços em Kz, rastreabilidade de lotes, validades e fotos inteligentes com IA' 
                : 'Consulta rápida de preços, códigos de barra e disponibilidade em estoque para atendimento'}
            </p>
          </div>
        </div>

        {/* Action Controls & View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sub-Tab Selector: Estoque vs Categorias */}
          <div className="flex items-center bg-zinc-100 border border-zinc-200 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setProductSubTab('inventory')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                productSubTab === 'inventory'
                  ? 'bg-white text-zinc-900 shadow-xs font-black'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Boxes size={14} />
              <span>Inventário</span>
            </button>
            <button
              type="button"
              onClick={() => setProductSubTab('categories')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                productSubTab === 'categories'
                  ? 'bg-white text-emerald-700 shadow-xs font-black'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <FolderTree size={14} />
              <span>Pastas 3D</span>
            </button>
          </div>

          {/* View Mode Toggle (Grid vs Table) - Only in inventory subtab */}
          {productSubTab === 'inventory' && (
            <div className="flex items-center bg-zinc-100 border border-zinc-200 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'grid'
                    ? 'bg-white text-zinc-900 shadow-xs font-black'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
                title="Modo Grade Visual [G]"
              >
                <LayoutGrid size={15} />
                <span className="hidden sm:inline">Grade</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-white text-zinc-900 shadow-xs font-black'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
                title="Modo Tabela Compacta [T]"
              >
                <List size={15} />
                <span className="hidden sm:inline">Tabela</span>
              </button>
            </div>
          )}

          {/* Export Excel Button */}
          <button
            type="button"
            onClick={() => {
              exportInventoryToExcel(filteredProducts);
              showToast('Planilha Excel gerada com sucesso.');
            }}
            className="px-3.5 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900 text-xs font-bold border border-zinc-200 flex items-center gap-2 transition cursor-pointer"
            title="Exportar dados para Excel (.xlsx)"
          >
            <Download size={15} className="text-emerald-600" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          {/* Quick Stock Replenish Button */}
          {isManager && (
            <button
              type="button"
              onClick={() => setIsQuickStockModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900 text-xs font-bold border border-zinc-200 flex items-center gap-2 transition cursor-pointer"
              title="Entrada rápida de mercadoria / reposição"
            >
              <Boxes size={15} className="text-amber-600" />
              <span>Entrada Rápida</span>
            </button>
          )}

          {/* Primary Create Button */}
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
            title="Cadastrar novo produto [N]"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>+ Novo Produto</span>
          </button>
        </div>
      </div>

      {productSubTab === 'categories' ? (
        <CategoriesSubscreenPage 
          inventoryProducts={products}
          onSelectCategoryFilter={(catName) => {
            setSelectedCategory(catName);
            setProductSubTab('inventory');
            showToast(`Filtrado por categoria: ${catName}`);
          }}
        />
      ) : (
        <>

      {/* 2. INTERACTIVE KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Artigos */}
        <div 
          onClick={() => {
            setActiveQuickFilter('all');
            setSelectedCategory('all');
          }}
          className={`bg-white rounded-3xl p-5 border transition-all cursor-pointer hover:border-zinc-300 shadow-sm hover:shadow-md ${
            activeQuickFilter === 'all' && selectedCategory === 'all' ? 'ring-2 ring-zinc-900 border-zinc-900' : 'border-zinc-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-500">Total em Catálogo</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-zinc-900">{metrics.totalArticles}</span>
                <span className="text-xs text-zinc-500 font-mono">({metrics.totalItems.toLocaleString('pt-AO')} un)</span>
              </div>
            </div>
            <div className="p-3 bg-zinc-100 text-zinc-800 rounded-2xl border border-zinc-200 shadow-inner">
              <Boxes size={20} />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Valoração de Venda:</span>
            <span className="font-mono font-bold text-zinc-900">{formatKz(metrics.totalValue)}</span>
          </div>
        </div>

        {/* Card 2: Abaixo do Mínimo / Crítico */}
        <div 
          onClick={() => setActiveQuickFilter(activeQuickFilter === 'lowStock' ? 'all' : 'lowStock')}
          className={`bg-white rounded-3xl p-5 border transition-all cursor-pointer hover:border-amber-400 shadow-sm hover:shadow-md ${
            activeQuickFilter === 'lowStock' 
              ? 'ring-2 ring-amber-500 border-amber-500' 
              : 'border-zinc-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-zinc-500">Abaixo do Mínimo</span>
                <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-1.5 py-0.5 rounded-md border border-amber-200">
                  Alerta
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-amber-600">{metrics.lowStockCount}</span>
                {metrics.outOfStockCount > 0 && (
                  <span className="text-xs text-rose-600 font-bold">
                    (+{metrics.outOfStockCount} esgotados)
                  </span>
                )}
              </div>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200 shadow-inner">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Requer Reposição</span>
            <span className="text-amber-600 font-bold">Clique para filtrar</span>
          </div>
        </div>

        {/* Card 3: Alerta de Validade */}
        <div 
          onClick={() => setActiveQuickFilter(activeQuickFilter === 'expiring' ? 'all' : 'expiring')}
          className={`bg-white rounded-3xl p-5 border transition-all cursor-pointer hover:border-rose-400 shadow-sm hover:shadow-md ${
            activeQuickFilter === 'expiring' 
              ? 'ring-2 ring-rose-500 border-rose-500' 
              : 'border-zinc-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-zinc-500">Validade Próxima</span>
                <span className="text-[10px] bg-rose-50 text-rose-800 font-bold px-1.5 py-0.5 rounded-md border border-rose-200">
                  ≤ 30 dias
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-rose-600">{metrics.totalExpiringAlerts}</span>
                {metrics.expiredCount > 0 && (
                  <span className="text-xs text-rose-700 font-bold">
                    ({metrics.expiredCount} vencidos)
                  </span>
                )}
              </div>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200 shadow-inner">
              <Hourglass size={20} />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Controle FIFO / Lote</span>
            <span className="text-rose-600 font-bold">Clique para filtrar</span>
          </div>
        </div>

        {/* Card 4: Margem Média & Lucro */}
        <div 
          onClick={() => setActiveQuickFilter(activeQuickFilter === 'highMargin' ? 'all' : 'highMargin')}
          className={`bg-white rounded-3xl p-5 border transition-all cursor-pointer hover:border-emerald-400 shadow-sm hover:shadow-md ${
            activeQuickFilter === 'highMargin' 
              ? 'ring-2 ring-emerald-500 border-emerald-500' 
              : 'border-zinc-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-500">Margem Média & Lucro</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-emerald-600">+{metrics.averageMargin}%</span>
                <span className="text-xs text-zinc-500 font-mono">bruta</span>
              </div>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-200 shadow-inner">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Lucro Potencial:</span>
            <span className="font-mono font-bold text-emerald-600">{formatKz(metrics.potentialProfit)}</span>
          </div>
        </div>
      </div>

      {/* 3. REVOLUTIONARY SEARCH, FILTER & CATEGORIES TOOLBAR */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-4 shadow-sm space-y-4">
        
        {/* Top Row: Search input + Sorting + Quick Filter Badges */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              ref={searchInputRef}
              id="search-products-input"
              type="text"
              placeholder="Pesquisar por nome, código de barras, lote, fornecedor... (Pressione /)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-zinc-50 focus:bg-white border border-zinc-300 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 transition-all font-medium"
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

          {/* Quick Status Chips */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setActiveQuickFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap ${
                activeQuickFilter === 'all'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200'
              }`}
            >
              Todos ({products.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveQuickFilter('lowStock')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeQuickFilter === 'lowStock'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-amber-700 border border-zinc-200'
              }`}
            >
              <AlertTriangle size={13} className="text-amber-600" />
              <span>Baixo ({metrics.lowStockCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveQuickFilter('outOfStock')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeQuickFilter === 'outOfStock'
                  ? 'bg-rose-100 text-rose-900 border border-rose-300 shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-rose-700 border border-zinc-200'
              }`}
            >
              <XCircle size={13} className="text-rose-600" />
              <span>Esgotados ({metrics.outOfStockCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveQuickFilter('expiring')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeQuickFilter === 'expiring'
                  ? 'bg-rose-100 text-rose-900 border border-rose-300 shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-rose-700 border border-zinc-200'
              }`}
            >
              <CalendarX size={13} className="text-rose-600" />
              <span>Validade ({metrics.totalExpiringAlerts})</span>
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11px] text-zinc-500 hidden sm:inline font-medium">Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 cursor-pointer"
              >
                <option value="name_asc">Nome (A-Z)</option>
                <option value="name_desc">Nome (Z-A)</option>
                <option value="stock_asc">Menor Estoque</option>
                <option value="stock_desc">Maior Estoque</option>
                <option value="price_desc">Maior Preço (Kz)</option>
                <option value="price_asc">Menor Preço (Kz)</option>
                <option value="expiry_asc">Validade Mais Próxima</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setActiveQuickFilter('all');
                }}
                title="Limpar todos os filtros"
                className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer border border-zinc-200"
              >
                <FilterX size={15} />
              </button>
            )}
          </div>

        </div>

        {/* Bottom Row: Category Pills Horizontal Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-zinc-200 pt-3">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider shrink-0 mr-1">
            Categorias:
          </span>

          {categories.map((cat) => {
            const count = cat === 'all' 
              ? products.length 
              : products.filter(p => p.category === cat).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900 border border-zinc-200'
                }`}
              >
                <span>{cat === 'all' ? 'Todas' : cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === cat ? 'bg-white/20 text-white font-mono' : 'bg-zinc-200 text-zinc-600 font-mono'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* 4. MAIN PRODUCT DISPLAY AREA (GRID OR TABLE) */}
      {products.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-zinc-200 rounded-3xl py-20 px-6 text-center flex flex-col items-center justify-center shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 mb-3 shadow-xs">
            <PackageOpen size={32} />
          </div>
          <h3 className="font-black text-base text-zinc-900">Nenhum Produto Cadastrado</h3>
          <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-5">
            Cadastre o primeiro artigo para começar o controle de estoque, preços e validades.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-6 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-extrabold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>Cadastrar Primeiro Produto</span>
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        /* No search results */
        <div className="bg-white border border-zinc-200 rounded-3xl py-16 px-6 text-center flex flex-col items-center justify-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 mb-3">
            <Search size={26} />
          </div>
          <h3 className="font-bold text-sm text-zinc-900">Nenhum resultado encontrado</h3>
          <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-4">
            Nenhum artigo corresponde à busca "{searchTerm}" ou aos filtros selecionados.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setActiveQuickFilter('all');
            }}
            className="px-4 py-2 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold border border-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Redefinir Filtros</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (VISUAL CARDS) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product, idx) => (
            <InventoryProductCard
              key={product.id}
              product={product}
              index={idx}
              isManager={isManager}
              isSelected={selectedProductIds.has(product.id)}
              onToggleSelect={handleToggleSelectProduct}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteProduct}
              onPrintLabel={(p) => setPrintingLabelProduct(p)}
              onViewDetails={handleViewDetails}
              onQuickStockAdjust={handleQuickStockAdjust}
            />
          ))}
        </div>
      ) : (
        /* TABLE VIEW (HIGH-DENSITY COMPACT) */
        <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 w-10 text-center">
                    {isManager && (
                      <input
                        type="checkbox"
                        checked={selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0}
                        onChange={() => {
                          if (selectedProductIds.size === filteredProducts.length) {
                            handleClearSelection();
                          } else {
                            handleSelectAll();
                          }
                        }}
                        className="w-4 h-4 rounded bg-zinc-100 border-zinc-300 text-zinc-900 accent-zinc-900 cursor-pointer"
                      />
                    )}
                  </th>
                  <th className="py-3.5 px-4">Produto / SKU</th>
                  <th className="py-3.5 px-4">Lote & Fornecedor</th>
                  <th className="py-3.5 px-4 text-center">Qtd Atual</th>
                  <th className="py-3.5 px-4 text-center">Est. Mínimo</th>
                  <th className="py-3.5 px-4">Validade</th>
                  <th className="py-3.5 px-4 text-right">Preço Venda</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {filteredProducts.map((p, idx) => {
                  const days = getDaysToExpiry(p.expirationDate);
                  const isOut = p.stock <= 0;
                  const isLow = p.stock > 0 && p.stock <= p.minStock;
                  const isExp = days !== null && days <= 0;
                  const isExpSoon = days !== null && days > 0 && days <= 30;

                  return (
                    <motion.tr 
                      key={p.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        duration: 0.22, 
                        delay: Math.min(idx * 0.03, 0.35),
                        ease: 'easeOut'
                      }}
                      className={`hover:bg-zinc-50/80 transition-colors group ${
                        selectedProductIds.has(p.id) ? 'bg-zinc-50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        {isManager && (
                          <input
                            type="checkbox"
                            checked={selectedProductIds.has(p.id)}
                            onChange={() => handleToggleSelectProduct(p.id)}
                            className="w-4 h-4 rounded bg-zinc-100 border-zinc-300 text-zinc-900 accent-zinc-900 cursor-pointer"
                          />
                        )}
                      </td>

                      {/* Produto / SKU */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div 
                            onClick={() => handleViewDetails(p)}
                            className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0 p-1 overflow-hidden cursor-pointer hover:border-zinc-400 transition-colors"
                          >
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                referrerPolicy="no-referrer"
                                className="max-h-8 w-auto object-contain"
                              />
                            ) : (
                              <span className="font-black text-xs text-zinc-400">
                                {p.name ? p.name.charAt(0).toUpperCase() : 'P'}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div 
                              onClick={() => handleViewDetails(p)}
                              className="font-bold text-zinc-900 text-xs hover:text-indigo-600 transition-colors truncate max-w-xs cursor-pointer"
                            >
                              {p.name}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-0.5">
                              <button
                                type="button"
                                onClick={() => handleCopySku(p.id, p.sku || p.barcode)}
                                className="font-mono text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
                                title="Copiar SKU"
                              >
                                <span>{p.sku}</span>
                                {copiedSkuId === p.id ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                              </button>
                              <span>•</span>
                              <span className="text-zinc-600">{p.category}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Lote & Fornecedor */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-zinc-800 text-xs">
                          {p.supplier || 'Fornecedor Padrão'}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5 font-mono">
                          {p.batch && (
                            <span className="text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                              {p.batch}
                            </span>
                          )}
                          {p.notes && <span className="truncate max-w-[100px]">{p.notes}</span>}
                        </div>
                      </td>

                      {/* Qtd Atual com Ajuste Rápido */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 bg-zinc-50 border border-zinc-200 px-2 py-1 rounded-xl">
                          {isManager && (
                            <button
                              type="button"
                              onClick={() => handleQuickStockAdjust(p, -1)}
                              disabled={p.stock <= 0}
                              className="text-zinc-400 hover:text-zinc-900 disabled:opacity-30 cursor-pointer p-0.5"
                              title="Subtrair 1"
                            >
                              -
                            </button>
                          )}
                          <span className={`font-mono font-black text-xs px-1 ${
                            isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-zinc-900'
                          }`}>
                            {p.stock} <span className="text-[10px] text-zinc-500 font-normal">{p.unit}</span>
                          </span>
                          {isManager && (
                            <button
                              type="button"
                              onClick={() => handleQuickStockAdjust(p, 1)}
                              className="text-zinc-400 hover:text-zinc-900 cursor-pointer p-0.5"
                              title="Adicionar 1"
                            >
                              +
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Estoque Mínimo */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono text-xs text-zinc-600">
                        {p.minStock} {p.unit}
                      </td>

                      {/* Validade */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className={`font-mono text-xs font-semibold ${
                          isExp ? 'text-rose-600' : isExpSoon ? 'text-amber-600' : 'text-zinc-700'
                        }`}>
                          {formatDateDisplay(p.expirationDate)}
                        </div>
                        {days !== null && (
                          <div className="text-[10px] text-zinc-500">
                            {days < 0 ? `Vencido` : days === 0 ? 'Vence hoje' : `${days}d restantes`}
                          </div>
                        )}
                      </td>

                      {/* Preço de Venda */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-black text-zinc-950 text-xs">
                          {formatKz(p.salePrice)}
                        </div>
                        {p.costPrice > 0 && (
                          <div className="text-[10px] text-zinc-500 font-mono">
                            Custo: {formatKz(p.costPrice)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isExp ? (
                          <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <XCircle size={11} /> Vencido
                          </span>
                        ) : isExpSoon ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <Clock size={11} /> Vence em {days}d
                          </span>
                        ) : isOut ? (
                          <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <XCircle size={11} /> Esgotado
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <AlertTriangle size={11} /> Baixo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={11} /> Normal
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleViewDetails(p)}
                            className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 border border-zinc-200 transition-colors cursor-pointer"
                            title="Raio-X / Detalhes"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setPrintingLabelProduct(p)}
                            className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 border border-zinc-200 transition-colors cursor-pointer"
                            title="Imprimir Etiqueta"
                          >
                            <Printer size={14} />
                          </button>

                          {isManager && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(p)}
                                className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 border border-zinc-200 transition-colors cursor-pointer"
                                title="Editar Artigo"
                              >
                                <Edit size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-1.5 rounded-xl bg-zinc-100 hover:bg-rose-50 text-zinc-600 hover:text-rose-600 border border-zinc-200 hover:border-rose-200 transition-colors cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. MULTI-SELECT FLOATING BATCH ACTION BAR */}
      <InventoryBatchBar
        selectedCount={selectedProductIds.size}
        totalCount={filteredProducts.length}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onBatchPrintLabels={handleBatchPrintLabels}
        onBatchExport={handleBatchExport}
      />

      {/* 6. MODAL UNIFICADO DE CRIAÇÃO / EDIÇÃO DE PRODUTO */}
      <InventoryEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
        mode={editModalMode}
      />

      {/* 7. DRAWER DE INSPEÇÃO / RAIO-X DO PRODUTO */}
      <InventoryDetailDrawer
        product={selectedProductForDetail}
        isOpen={isDetailDrawerOpen}
        isManager={isManager}
        onClose={() => setIsDetailDrawerOpen(false)}
        onEdit={(p) => {
          setIsDetailDrawerOpen(false);
          handleOpenEditModal(p);
        }}
        onDelete={handleDeleteProduct}
        onPrintLabel={(p) => setPrintingLabelProduct(p)}
        onStockAdjust={handleDrawerStockAdjust}
      />

      {/* 8. MODAL DE ENTRADA RÁPIDA DE ESTOQUE */}
      <InventoryQuickStockModal
        isOpen={isQuickStockModalOpen}
        products={products}
        onClose={() => setIsQuickStockModalOpen(false)}
        onApplyStockEntry={handleApplyQuickStockEntry}
      />

      {/* 9. MODAL DE IMPRESSÃO DE ETIQUETAS COM CÓDIGO DE BARRAS */}
      <ProductLabelPrintModal
        product={printingLabelProduct ? {
          name: printingLabelProduct.name,
          price: printingLabelProduct.salePrice,
          code: printingLabelProduct.barcode || printingLabelProduct.sku || `MSK-${printingLabelProduct.id.slice(0, 6)}`
        } : null}
        isOpen={!!printingLabelProduct}
        onClose={() => setPrintingLabelProduct(null)}
      />

      {/* 10. MODAL DE ALERTA DE ACESSO RESTRITO */}
      {restrictedActionAlert && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4 animate-in zoom-in-95 duration-150 text-xs text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
              <Lock size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-zinc-900">Ação Restrita a Gerente</h3>
              <p className="text-zinc-500 text-xs">
                {restrictedActionAlert}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-left text-[11px] text-zinc-700 space-y-1.5">
              <p className="font-bold text-zinc-900 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Matriz de Permissões Masakula:</span>
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-zinc-600">
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
                className="px-4 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold cursor-pointer border border-zinc-200 transition"
              >
                Ver Matriz de Acessos
              </button>
              <button
                type="button"
                onClick={() => setRestrictedActionAlert(null)}
                className="px-5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold cursor-pointer transition shadow-sm"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. MODAL DA MATRIZ DE PERMISSÕES */}
      <PermissionMatrixModal
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
      />
      </>
      )}

    </div>
  );
};
