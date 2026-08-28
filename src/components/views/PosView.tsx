import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Barcode, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  Send, 
  User, 
  CheckCircle2, 
  Printer, 
  X,
  Receipt,
  Percent,
  Keyboard,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Building2,
  Smartphone,
  Check,
  Tag,
  SlidersHorizontal,
  Package,
  RotateCcw,
  ShieldAlert
} from 'lucide-react';
import { Product, CartItem, PaymentMethod, SaleTransaction, Customer } from '../../types';
import { formatKz, formatDateTime } from '../../utils/formatters';
import { supabaseService } from '../../services/supabaseService';
import { ThermalReceipt } from '../ThermalReceipt';
import SaleFeedbackModal from '../SaleFeedbackModal';
import { useAuth } from '../../contexts/AuthContext';
import { ManagerAuthModal } from '../auth/ManagerAuthModal';

interface PosViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  sales: SaleTransaction[];
  setSales: React.Dispatch<React.SetStateAction<SaleTransaction[]>>;
  customers: Customer[];
}

// Web Audio API scanner beep synthesizer for authentic POS feedback
function playScannerBeep(type: 'success' | 'error' = 'success') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, ctx.currentTime); // A6 note
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch {
    // Audio might be blocked by browser policy until interaction
  }
}

export const PosView: React.FC<PosViewProps> = ({
  products,
  setProducts,
  sales,
  setSales,
  customers,
}) => {
  // Input search & barcode scanner state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Consumidor Final');
  const [customerNif, setCustomerNif] = useState('');
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  
  // Feedback toast banner
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Sale Feedback Modal (Happy/Sad Bag)
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    type: 'SUCCESS' | 'CANCELED' | null;
    totalAmount: number;
    changeAmount: number;
  }>({
    isOpen: false,
    type: null,
    totalAmount: 0,
    changeAmount: 0,
  });

  // Checkout & Payment Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [lastCompletedSale, setLastCompletedSale] = useState<SaleTransaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Authentication & Refund Protection State
  const { profile } = useAuth();
  const [isManagerAuthOpen, setIsManagerAuthOpen] = useState(false);
  const [pendingRefundSale, setPendingRefundSale] = useState<SaleTransaction | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);

  // References
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus barcode input on component mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Flash feedback helper
  const showFeedback = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedbackToast({ message, type });
    const timer = setTimeout(() => setFeedbackToast(null), 3000);
    return () => clearTimeout(timer);
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered products catalog
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.barcode.includes(term) ||
        (p.category && p.category.toLowerCase().includes(term))
      );
    });
  }, [products, searchTerm, selectedCategory]);

  // Add Product to Cart
  const addToCart = (product: Product, quantityToAdd: number = 1) => {
    if (product.stock <= 0) {
      playScannerBeep('error');
      showFeedback(`Produto "${product.name}" sem stock em armazém!`, 'error');
      return false;
    }

    let addedSuccessfully = true;

    setCart((prev) => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const nextQty = existing.quantity + quantityToAdd;
        if (nextQty > product.stock) {
          playScannerBeep('error');
          showFeedback(`Limite de stock atingido (${product.stock} ${product.unit}).`, 'error');
          addedSuccessfully = false;
          return prev;
        }
        playScannerBeep('success');
        showFeedback(`+1 "${product.name}" no carrinho (Total: ${nextQty})`, 'success');
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: nextQty } 
            : item
        );
      }
      playScannerBeep('success');
      showFeedback(`"${product.name}" adicionado ao carrinho!`, 'success');
      return [...prev, { product, quantity: quantityToAdd }];
    });

    return addedSuccessfully;
  };

  // Update Cart Quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.product.stock) {
            playScannerBeep('error');
            showFeedback(`Stock disponível: apenas ${item.product.stock} ${item.product.unit}`, 'error');
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  // Remove from Cart
  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Cenário 1: Antes da Venda (No Carrinho / Checkout)
  // Cancela o atendimento atual, limpa os itens selecionados e reseta o formulário de pagamento.
  // Permissão: Caixa ou Gerente (Livre). Ação no Banco: Nenhum impacto. Dispara modal "Pagamento Cancelado".
  const handleCancelOrderBeforeSale = () => {
    if (cart.length === 0 && !isCheckoutOpen) return;
    const currentTotal = totalPayable;
    setCart([]);
    setIsCheckoutOpen(false);
    setCashGiven('');
    setGlobalDiscount(0);
    setCustomerName('Consumidor Final');
    setCustomerNif('');

    setFeedbackModal({
      isOpen: true,
      type: 'CANCELED',
      totalAmount: currentTotal,
      changeAmount: 0,
    });
    showFeedback('Atendimento cancelado e formulário resetado.', 'info');
    searchInputRef.current?.focus();
  };

  const clearCart = handleCancelOrderBeforeSale;

  // Cenário 2: Depois da Venda (Estorno de Venda Concluída)
  // Reverte a venda no histórico, devolve os produtos automaticamente ao estoque e marca a venda como CANCELED.
  // Permissão: Requer Gerente (Perfil ou PIN de autorização). Ação no Banco: Executa procedure atômica no Supabase.
  const handleRequestRefund = (sale: SaleTransaction) => {
    if (sale.status === 'canceled') {
      showFeedback('Esta venda já se encontra cancelada / estornada.', 'error');
      return;
    }

    if (profile?.role === 'GERENTE') {
      if (window.confirm(`Confirma o estorno da venda ${sale.invoiceNumber}? Os produtos serão devolvidos ao estoque e a venda marcada como CANCELED no banco de dados.`)) {
        executeRefund(sale);
      }
    } else {
      // Perfil CAIXA: Solicita autorização presencial do Gerente via PIN
      setPendingRefundSale(sale);
      setIsManagerAuthOpen(true);
    }
  };

  const executeRefund = async (sale: SaleTransaction) => {
    setIsRefunding(true);
    try {
      // 1. Devolve automaticamente cada produto ao estoque local
      setProducts(prevProducts => {
        return prevProducts.map(prod => {
          const soldItem = sale.items.find(item => item.product.id === prod.id);
          if (soldItem) {
            const newStock = prod.stock + soldItem.quantity;
            return {
              ...prod,
              stock: newStock,
              status: (newStock <= 0 ? 'out_of_stock' : newStock <= prod.minStock ? 'low_stock' : 'active') as any
            };
          }
          return prod;
        });
      });

      // 2. Marca a venda como 'canceled' no estado local
      setSales(prevSales => prevSales.map(s => s.id === sale.id ? { ...s, status: 'canceled' } : s));

      if (lastCompletedSale && lastCompletedSale.id === sale.id) {
        setLastCompletedSale(prev => prev ? { ...prev, status: 'canceled' } : null);
      }

      // 3. Executa procedure atômica no Supabase (devolve estoque e atualiza status para CANCELED)
      await supabaseService.cancelOrRefundSale(
        sale.id,
        sale.items.map(item => ({ productId: item.product.id, quantity: item.quantity })),
        `Estorno autorizado por ${profile?.full_name || 'Gerente'}`
      );

      playScannerBeep('success');
      showFeedback(`Estorno da Venda ${sale.invoiceNumber} efetuado com sucesso! Estoque reposto.`, 'success');
    } catch (err) {
      console.error('Erro ao processar estorno:', err);
      showFeedback('Erro ao comunicar estorno com o banco de dados.', 'error');
    } finally {
      setIsRefunding(false);
      setPendingRefundSale(null);
      setIsManagerAuthOpen(false);
    }
  };

  // Barcode / Enter Handler in Search Field
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = searchTerm.trim();
      if (!code) return;

      // 1. Check exact barcode match
      const exactBarcode = products.find(p => p.barcode === code);
      if (exactBarcode) {
        addToCart(exactBarcode);
        setSearchTerm('');
        return;
      }

      // 2. Check exact SKU match
      const exactSku = products.find(p => p.sku.toLowerCase() === code.toLowerCase());
      if (exactSku) {
        addToCart(exactSku);
        setSearchTerm('');
        return;
      }

      // 3. Check first filtered product if there's only 1 or top match
      if (filteredProducts.length > 0) {
        addToCart(filteredProducts[0]);
        setSearchTerm('');
      } else {
        playScannerBeep('error');
        showFeedback(`Código ou produto "${code}" não encontrado.`, 'error');
      }
    }
  };

  // Global Keyboard Shortcuts (F2, F3, F4, F9, ESC)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // F9 or Ctrl+Space: Open Checkout Modal (also F2 if not used for search)
      if (e.key === 'F9' || (e.ctrlKey && e.code === 'Space')) {
        e.preventDefault();
        if (cart.length > 0 && !isCheckoutOpen && !lastCompletedSale) {
          setIsCheckoutOpen(true);
        } else if (cart.length === 0) {
          showFeedback('Adicione produtos ao carrinho antes de cobrar.', 'error');
        }
        return;
      }

      // F2 or F3: Focus on Search/Barcode input
      if (e.key === 'F2' || e.key === 'F3') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        showFeedback('Leitor de código de barras focado [F2/F3]', 'info');
        return;
      }

      // F4: Clear Cart
      if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) {
          clearCart();
        }
        return;
      }

      // ESC: Close Modals
      if (e.key === 'Escape') {
        if (isCheckoutOpen) {
          setIsCheckoutOpen(false);
          searchInputRef.current?.focus();
        } else if (lastCompletedSale) {
          setLastCompletedSale(null);
          searchInputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [cart, isCheckoutOpen, lastCompletedSale]);

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.salePrice * item.quantity), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      return (subtotal * globalDiscount) / 100;
    }
    return Math.min(subtotal, globalDiscount);
  }, [subtotal, globalDiscount, discountType]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(taxableAmount * 0.14); // IVA 14% Angola
  const totalPayable = taxableAmount + taxAmount;

  const cashGivenNum = parseFloat(cashGiven) || 0;
  const changeDue = Math.max(0, cashGivenNum - totalPayable);
  const isCashInsufficient = selectedPayment === 'cash' && cashGivenNum > 0 && cashGivenNum < totalPayable;

  // Preset quick cash denominations
  const quickCashPresets = [
    { label: 'Exato', value: totalPayable },
    { label: '+1.000', add: 1000 },
    { label: '+2.000', add: 2000 },
    { label: '+5.000', add: 5000 },
    { label: '+10.000', add: 10000 },
    { label: '+20.000', add: 20000 },
  ];

  // Complete Sale & Process Transaction
  const handleCompleteSale = async () => {
    if (cart.length === 0 || isSubmitting) return;

    if (selectedPayment === 'cash' && cashGivenNum < totalPayable) {
      playScannerBeep('error');
      alert('O valor entregue em dinheiro é inferior ao total da venda!');
      return;
    }

    setIsSubmitting(true);

    const nextInvoiceNum = `FT MAS26/${String(sales.length + 485).padStart(5, '0')}`;
    
    const newSale: SaleTransaction = {
      id: `sale-${Date.now()}`,
      invoiceNumber: nextInvoiceNum,
      customerName: customerName.trim() || 'Consumidor Final',
      customerNif: customerNif.trim() || undefined,
      items: [...cart],
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total: totalPayable,
      paymentMethod: selectedPayment,
      cashierName: 'Adilson Silva (Operador 01)',
      createdAt: new Date().toISOString(),
      status: 'paid',
    };

    // 1. Deduct stock locally and update state
    const updatedProducts = products.map(prod => {
      const soldItem = cart.find(ci => ci.product.id === prod.id);
      if (soldItem) {
        const newStock = Math.max(0, prod.stock - soldItem.quantity);
        // Sync single product stock with Supabase
        supabaseService.updateProductStock(prod.id, newStock).catch(err => console.warn('Supabase stock sync:', err));
        return {
          ...prod,
          stock: newStock,
          status: (newStock === 0 ? 'out_of_stock' : newStock <= prod.minStock ? 'low_stock' : 'active') as any,
        };
      }
      return prod;
    });

    setProducts(updatedProducts);
    setSales(prev => [newSale, ...prev]);

    // 2. Sync sale to Supabase asynchronously
    supabaseService.insertSale(newSale, {
      amountPaid: selectedPayment === 'cash' ? (cashGivenNum || totalPayable) : totalPayable,
      changeGiven: selectedPayment === 'cash' ? changeDue : 0,
    }).catch(err => console.warn('Supabase sale insert:', err));

    // 3. Finalize UI states
    playScannerBeep('success');
    setLastCompletedSale(newSale);
    setFeedbackModal({
      isOpen: true,
      type: 'SUCCESS',
      totalAmount: totalPayable,
      changeAmount: selectedPayment === 'cash' ? changeDue : 0,
    });
    setCart([]);
    setIsCheckoutOpen(false);
    setCashGiven('');
    setGlobalDiscount(0);
    setIsSubmitting(false);

    // 4. Trigger auto-print if needed
    setTimeout(() => {
      // Prepared for instant printing or preview
      showFeedback(`Venda finalizada com sucesso (${newSale.invoiceNumber})`, 'success');
    }, 150);
  };

  // Payment method options with labels and icons
  const paymentMethods: { id: PaymentMethod; label: string; sub: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: 'cash', label: 'Dinheiro', sub: 'Numerário Kz', icon: Banknote },
    { id: 'multicaixa', label: 'Multicaixa TPA', sub: 'Cartão de Débito', icon: CreditCard },
    { id: 'express', label: 'Multicaixa Express', sub: 'Telemóvel / App', icon: Smartphone },
    { id: 'transfer', label: 'Transferência', sub: 'IBAN Bancário', icon: Building2 },
  ];

  return (
    <div id="view-pos" className="flex flex-col h-[calc(100vh-130px)] select-none animate-in fade-in duration-200">
      {/* Dynamic Notification Toast */}
      {feedbackToast && (
        <div 
          className={`fixed top-4 right-8 z-50 px-4 py-2.5 rounded-2xl shadow-lg border text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-3 duration-150 ${
            feedbackToast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : feedbackToast.type === 'info'
              ? 'bg-zinc-900 border-zinc-800 text-white'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {feedbackToast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Main Split Layout: Left (2/3) Catalog & Scanner | Right (1/3) Active Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 overflow-hidden">
        {/* =========================================================================
            LADO ESQUERDO (2/3): CATÁLOGO RÁPIDO & LEITOR DE CÓDIGO DE BARRAS
           ========================================================================= */}
        <div className="lg:col-span-8 flex flex-col gap-3 h-full min-h-0 overflow-hidden">
          {/* Barcode Search & Category Header */}
          <div className="bg-white p-3.5 rounded-3xl border border-gray-100 shadow-xs space-y-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-zinc-400">
                  <Barcode size={18} className="text-zinc-600" />
                  <Search size={14} />
                </div>
                <input
                  id="pos-search-input"
                  ref={searchInputRef}
                  type="text"
                  placeholder="Ler código de barras com scanner ou pesquisar por nome/SKU... [Enter para adicionar]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full pl-14 pr-10 py-3 rounded-2xl bg-zinc-50 border border-gray-200 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:border-transparent focus:outline-none transition-all shadow-inner"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-1"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Quick shortcut indicator */}
              <button
                type="button"
                onClick={() => {
                  searchInputRef.current?.focus();
                  searchInputRef.current?.select();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-colors"
                title="Atalho para focar a barra de leitura (F3)"
              >
                <Keyboard size={14} />
                <span className="font-mono text-[10px]">F3</span>
              </button>
            </div>

            {/* Category Carousel Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {categories.map((cat) => {
                const count = cat === 'all' 
                  ? products.length 
                  : products.filter(p => p.category === cat).length;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      selectedCategory === cat
                        ? 'bg-zinc-950 text-white shadow-xs scale-100'
                        : 'bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200/80'
                    }`}
                  >
                    <span>{cat === 'all' ? 'Todos os Produtos' : cat}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedCategory === cat ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Cards Catalog Grid */}
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
            {filteredProducts.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-gray-100 p-6">
                <Package size={36} className="text-zinc-300 mb-2" />
                <h4 className="font-bold text-sm text-zinc-800">Nenhum produto encontrado</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                  Não foram encontrados artigos com os filtros aplicados ou código pesquisado.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    searchInputRef.current?.focus();
                  }}
                  className="mt-3 px-4 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold"
                >
                  Limpar Filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 pb-2">
                {filteredProducts.map((product) => {
                  const isOut = product.stock <= 0;
                  const isLow = product.stock <= product.minStock;
                  const inCartItem = cart.find(ci => ci.product.id === product.id);

                  return (
                    <div
                      key={product.id}
                      onClick={() => !isOut && addToCart(product)}
                      className={`relative p-3.5 rounded-2xl border transition-all flex flex-col justify-between select-none ${
                        isOut
                          ? 'bg-zinc-50 border-gray-200 opacity-60 cursor-not-allowed'
                          : inCartItem
                          ? 'bg-emerald-50/40 border-emerald-300 shadow-xs hover:shadow-md cursor-pointer active:scale-97'
                          : 'bg-white border-gray-100 hover:border-zinc-300 hover:shadow-sm cursor-pointer active:scale-97'
                      }`}
                    >
                      {/* In-cart indicator badge */}
                      {inCartItem && (
                        <div className="absolute -top-2 -right-2 bg-emerald-600 text-white w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center shadow-sm border-2 border-white">
                          {inCartItem.quantity}
                        </div>
                      )}

                      <div>
                        {/* Top Category & Stock Badge */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-bold text-zinc-400 truncate max-w-[90px]">
                            {product.category || 'Geral'}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 ${
                              isOut
                                ? 'bg-rose-100 text-rose-700'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isOut ? 'Esgotado' : `${product.stock} ${product.unit || 'un'}`}
                          </span>
                        </div>

                        {/* Title & SKU */}
                        <h4 className="font-bold text-xs text-zinc-900 line-clamp-2 leading-snug">
                          {product.name}
                        </h4>
                        
                        <p className="text-[10px] font-mono text-zinc-400 mt-1 flex items-center gap-1">
                          <Barcode size={10} />
                          <span className="truncate">{product.barcode}</span>
                        </p>
                      </div>

                      {/* Price & Quick Add Button */}
                      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <span className="font-black text-xs text-zinc-950 block">
                            {formatKz(product.salePrice)}
                          </span>
                        </div>
                        <div 
                          className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                            isOut
                              ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                              : inCartItem
                              ? 'bg-emerald-600 text-white'
                              : 'bg-zinc-950 text-white hover:bg-zinc-800'
                          }`}
                        >
                          <Plus size={15} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            LADO DIREITO (1/3): CARRINHO DE COMPRAS ATIVO & CHECKOUT
           ========================================================================= */}
        <div className="lg:col-span-4 flex flex-col h-full bg-white rounded-3xl border border-gray-100 shadow-xs p-4 justify-between min-h-0 overflow-hidden">
          {/* Cart Header */}
          <div className="space-y-2.5 pb-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
                  <ShoppingCart size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-zinc-900">Talão / Caixa Aberto</h3>
                  <p className="text-[10px] text-zinc-400">
                    {cart.reduce((acc, ci) => acc + ci.quantity, 0)} {cart.length === 1 ? 'artigo' : 'artigos'}
                  </p>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-1 transition-colors"
                  title="Limpar Carrinho [F4]"
                >
                  <Trash2 size={12} />
                  <span>Limpar [F4]</span>
                </button>
              )}
            </div>

            {/* Customer Identification in POS */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">Cliente</label>
                <select
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    const found = customers.find(c => c.name === e.target.value);
                    if (found) setCustomerNif(found.nifOrBi);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-50 border border-gray-200 text-zinc-900 text-xs font-semibold focus:ring-1 focus:ring-zinc-950 focus:outline-none"
                >
                  <option value="Consumidor Final">Consumidor Final</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">NIF (AGT)</label>
                <input
                  type="text"
                  placeholder="Ex: 5409182736"
                  value={customerNif}
                  onChange={(e) => setCustomerNif(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-50 border border-gray-200 text-zinc-900 text-xs font-semibold focus:ring-1 focus:ring-zinc-950 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto py-2.5 space-y-2 custom-scrollbar min-h-0">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 p-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-50 text-zinc-300 flex items-center justify-center mb-2">
                  <ShoppingCart size={24} />
                </div>
                <p className="text-xs font-bold text-zinc-700">Carrinho Vazio</p>
                <p className="text-[11px] text-zinc-400 mt-0.5 max-w-[200px]">
                  Passe os códigos de barras no scanner ou selecione os produtos do catálogo à esquerda.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="p-2.5 rounded-2xl bg-zinc-50 border border-gray-100 flex items-center justify-between gap-2.5 text-xs hover:bg-zinc-100/70 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-zinc-900 truncate leading-tight">{item.product.name}</h5>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-zinc-500 font-medium">
                        {formatKz(item.product.salePrice)}
                      </span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-200/60 font-mono text-zinc-600">
                        {item.product.unit || 'un'}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-xl border border-gray-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-md transition-colors"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="font-extrabold text-zinc-950 px-1 text-xs">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-md transition-colors"
                    >
                      <Plus size={11} />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right shrink-0 min-w-[70px]">
                    <span className="font-black text-zinc-950 block text-xs">
                      {formatKz(item.product.salePrice * item.quantity)}
                    </span>
                  </div>

                  {/* Delete Item */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-zinc-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Remover item"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Cart Calculation & Checkout Trigger */}
          <div className="pt-2.5 border-t border-gray-100 space-y-2.5 shrink-0">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal:</span>
                <span className="font-semibold text-zinc-800">{formatKz(subtotal)}</span>
              </div>

              {/* Discount Selector */}
              <div className="flex justify-between items-center text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Tag size={12} className="text-rose-500" />
                  <span>Desconto:</span>
                  <div className="inline-flex rounded-lg bg-zinc-100 p-0.5">
                    <button
                      type="button"
                      onClick={() => setDiscountType('percent')}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        discountType === 'percent' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500'
                      }`}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('fixed')}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        discountType === 'fixed' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500'
                      }`}
                    >
                      Kz
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'percent' ? 100 : subtotal}
                    value={globalDiscount || ''}
                    placeholder="0"
                    onChange={(e) => {
                      const val = Math.max(0, parseFloat(e.target.value) || 0);
                      setGlobalDiscount(discountType === 'percent' ? Math.min(100, val) : val);
                    }}
                    className="w-14 px-1.5 py-0.5 rounded-lg bg-zinc-100 text-center font-extrabold text-zinc-900 text-[11px] focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  />
                </span>
                <span className="font-bold text-rose-600">
                  {discountAmount > 0 ? `-${formatKz(discountAmount)}` : '0 Kz'}
                </span>
              </div>

              <div className="flex justify-between text-zinc-500">
                <span>IVA Geral (14%):</span>
                <span className="font-semibold text-zinc-800">{formatKz(taxAmount)}</span>
              </div>

              {/* Total Final */}
              <div className="flex justify-between items-center text-sm font-black text-zinc-950 pt-1.5 border-t border-gray-100">
                <span>Total a Cobrar:</span>
                <span className="text-emerald-700 text-lg font-black">{formatKz(totalPayable)}</span>
              </div>
            </div>

            {/* Primary Action: Cobrar [F9 / F2] */}
            <button
              id="btn-pos-checkout"
              type="button"
              disabled={cart.length === 0}
              onClick={() => setIsCheckoutOpen(true)}
              className={`w-full py-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${
                cart.length === 0
                  ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                  : 'bg-zinc-950 hover:bg-zinc-800 text-white active:scale-98 cursor-pointer'
              }`}
            >
              <CreditCard size={16} className="text-emerald-400" />
              <span>Cobrar {formatKz(totalPayable)}</span>
              <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md font-mono">F9 / F2</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Shortcuts Legend */}
      <div className="mt-3 py-2 px-4 bg-white rounded-2xl border border-gray-100 shadow-2xs flex flex-wrap items-center justify-between text-[11px] text-zinc-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 border border-gray-200 font-mono font-bold text-[10px] text-zinc-800">F9 / F2</kbd>
            <span>Finalizar Venda / Pagamento</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 border border-gray-200 font-mono font-bold text-[10px] text-zinc-800">F2 / F3</kbd>
            <span>Focar Leitor Código de Barras</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 border border-gray-200 font-mono font-bold text-[10px] text-zinc-800">F4</kbd>
            <span>Limpar Carrinho</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 border border-gray-200 font-mono font-bold text-[10px] text-zinc-800">ESC</kbd>
            <span>Fechar Janela</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-emerald-700 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Caixa 01 Operacional • Masakula POS</span>
        </div>
      </div>

      {/* =========================================================================
          MODAL DE FINALIZAÇÃO DE VENDA & CÁLCULO DE TROCO (CHECKOUT)
         ========================================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-extrabold text-base text-zinc-950">Finalizar Venda & Checkout</h3>
                <p className="text-[11px] text-zinc-400">
                  Cliente: <span className="font-bold text-zinc-800">{customerName}</span> {customerNif && `(NIF: ${customerNif})`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
                title="Fechar [ESC]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Total Payable Card */}
            <div className="p-4 rounded-2xl bg-zinc-950 text-white text-center space-y-1 shadow-inner">
              <span className="text-[10px] text-zinc-400 uppercase font-extrabold tracking-wider">Total a Pagar</span>
              <div className="text-3xl font-black text-emerald-400">{formatKz(totalPayable)}</div>
              <div className="text-[11px] text-zinc-400">
                Subtotal: {formatKz(subtotal)} • IVA (14%): {formatKz(taxAmount)}
              </div>
            </div>

            {/* Payment Method Selector (4 Options) */}
            <div className="space-y-2">
              <label className="font-bold text-zinc-700 block text-xs">Método de Pagamento</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {paymentMethods.map((m) => {
                  const Icon = m.icon;
                  const isSelected = selectedPayment === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedPayment(m.id)}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                        isSelected
                          ? 'bg-zinc-950 text-white border-zinc-950 shadow-md scale-102'
                          : 'bg-zinc-50 border-gray-200 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300'
                      }`}
                    >
                      <Icon size={18} className={isSelected ? 'text-emerald-400' : 'text-zinc-600'} />
                      <div>
                        <span className="font-bold text-xs block leading-tight">{m.label}</span>
                        <span className={`text-[9px] block ${isSelected ? 'text-zinc-400' : 'text-zinc-400'}`}>{m.sub}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dinheiro / Numerário Specific Change Calculator */}
            {selectedPayment === 'cash' ? (
              <div className="p-4 rounded-2xl bg-zinc-50 border border-gray-200 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-zinc-800 text-xs">Valor Recebido do Cliente (Kz)</label>
                    <span className="text-[10px] text-zinc-400">Cédulas em Kwanzas</span>
                  </div>
                  <input
                    type="number"
                    autoFocus
                    placeholder={`Ex: ${totalPayable}`}
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (!isCashInsufficient || cashGivenNum >= totalPayable)) {
                        handleCompleteSale();
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-zinc-950 font-black text-base focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  />
                </div>

                {/* Quick Presets Buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {quickCashPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (preset.value !== undefined) {
                          setCashGiven(String(preset.value));
                        } else if (preset.add !== undefined) {
                          const current = parseFloat(cashGiven) || 0;
                          setCashGiven(String(current + preset.add));
                        }
                      }}
                      className="px-2.5 py-1 rounded-xl bg-white hover:bg-zinc-200 border border-gray-200 text-zinc-800 font-bold text-[11px] transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Change Calculation Box with Visual Alert */}
                {isCashInsufficient ? (
                  <div className="p-2.5 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-between text-rose-800 font-bold text-xs">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle size={14} />
                      Valor insuficiente
                    </span>
                    <span>Faltam {formatKz(totalPayable - cashGivenNum)}</span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-100/80 border border-emerald-200 flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-900 flex items-center gap-1.5">
                      <Check size={14} />
                      Troco a Devolver:
                    </span>
                    <span className="text-emerald-950 font-black text-sm">{formatKz(changeDue)}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-zinc-50 border border-gray-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h5 className="font-bold text-zinc-900 text-xs">
                    {selectedPayment === 'multicaixa' && 'Pagamento por Terminal TPA'}
                    {selectedPayment === 'express' && 'Pagamento por Multicaixa Express'}
                    {selectedPayment === 'transfer' && 'Transferência Bancária'}
                  </h5>
                  <p className="text-[11px] text-zinc-500">
                    Aguarde a confirmação de débito no terminal ou receção do comprovativo.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCancelOrderBeforeSale}
                className="px-3.5 py-2.5 rounded-2xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold flex items-center gap-1.5 transition-colors"
                title="Cancelar atendimento, limpar itens e resetar formulário"
              >
                <Trash2 size={14} />
                <span>Cancelar Atendimento</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-gray-200 text-zinc-700 hover:bg-zinc-50 font-semibold"
                >
                  Voltar [ESC]
                </button>

                <button
                  id="btn-confirm-pos-sale"
                  type="button"
                  disabled={isSubmitting || (selectedPayment === 'cash' && cashGivenNum < totalPayable)}
                  onClick={handleCompleteSale}
                  className={`px-5 py-2.5 rounded-2xl font-extrabold shadow-sm flex items-center gap-2 transition-all ${
                    isSubmitting || (selectedPayment === 'cash' && cashGivenNum < totalPayable)
                      ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-zinc-950 active:scale-98 cursor-pointer'
                  }`}
                >
                  <CheckCircle2 size={16} />
                  <span>{isSubmitting ? 'A Registar...' : 'Confirmar & Emitir Talão'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE CONFIRMAÇÃO & TALÃO TÉRMICO CERTIFICADO AGT (80mm)
         ========================================================================= */}
      {lastCompletedSale && (
        <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="text-center space-y-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm ${
                lastCompletedSale.status === 'canceled'
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-emerald-100 text-emerald-600'
              }`}>
                {lastCompletedSale.status === 'canceled' ? <RotateCcw size={24} /> : <CheckCircle2 size={24} />}
              </div>
              <h3 className="font-black text-base text-zinc-950">
                {lastCompletedSale.status === 'canceled' ? 'Venda Estornada / Cancelada' : 'Venda Registada com Sucesso!'}
              </h3>
              <p className="text-zinc-500 text-[11px]">
                {lastCompletedSale.status === 'canceled'
                  ? 'Estoque devolvido e venda anulada no sistema fiscal'
                  : 'Talão emitido e transmitido para a AGT'}
              </p>
            </div>

            {/* Thermal Receipt Preview (80mm standard format) */}
            <div className="bg-zinc-50 p-4 rounded-2xl border border-gray-200 font-mono text-[10px] text-zinc-800 space-y-2.5 shadow-inner relative">
              {lastCompletedSale.status === 'canceled' && (
                <div className="absolute inset-0 bg-rose-50/80 backdrop-blur-[1px] rounded-2xl flex items-center justify-center pointer-events-none">
                  <span className="border-2 border-rose-600 text-rose-600 font-black text-base px-4 py-1 rounded-xl rotate-[-12deg] uppercase tracking-widest">
                    ANULADO / ESTORNO
                  </span>
                </div>
              )}
              <div className="text-center border-b border-dashed border-gray-300 pb-2">
                <p className="font-extrabold text-zinc-950 text-[11px]">MASAKULA TECH & RETAIL</p>
                <p>NIF: 5417082910</p>
                <p>Avenida 4 de Fevereiro, Luanda - Angola</p>
                <p>Tel: +244 923 000 111</p>
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between font-bold text-zinc-950">
                  <span>DOC: {lastCompletedSale.invoiceNumber}</span>
                  <span>{formatDateTime(lastCompletedSale.createdAt)}</span>
                </div>
                <div>Cliente: <span className="font-semibold">{lastCompletedSale.customerName}</span></div>
                {lastCompletedSale.customerNif && <div>NIF: {lastCompletedSale.customerNif}</div>}
                <div>Operador: {lastCompletedSale.cashierName}</div>
              </div>

              {/* Items List */}
              <div className="border-t border-b border-dashed border-gray-300 py-1.5 space-y-1">
                {lastCompletedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate max-w-[170px]">{item.quantity}x {item.product.name}</span>
                    <span className="font-semibold">{formatKz(item.product.salePrice * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-0.5 text-right font-medium">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatKz(lastCompletedSale.subtotal)}</span>
                </div>
                {lastCompletedSale.discount > 0 && (
                  <div className="flex justify-between text-rose-700">
                    <span>Desconto:</span>
                    <span>-{formatKz(lastCompletedSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>IVA Geral (14%):</span>
                  <span>{formatKz(lastCompletedSale.tax)}</span>
                </div>
                <div className="flex justify-between font-black text-xs text-zinc-950 pt-1 border-t border-gray-300">
                  <span>TOTAL KZ:</span>
                  <span>{formatKz(lastCompletedSale.total)}</span>
                </div>
                <div className="flex justify-between text-[9px] text-zinc-500 pt-0.5">
                  <span>Meio de Pagamento:</span>
                  <span className="uppercase font-bold">{lastCompletedSale.paymentMethod}</span>
                </div>
              </div>

              {/* AGT Certification Footer */}
              <div className="text-center text-[9px] text-zinc-400 pt-2 border-t border-dashed border-gray-300 space-y-0.5">
                <p>AGT-CERT/2026/8920 • Software Certificado</p>
                <p className="font-bold text-zinc-600">Obrigado pela preferência!</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer size={14} />
                  <span>Imprimir Talão</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLastCompletedSale(null);
                    searchInputRef.current?.focus();
                  }}
                  className="flex-1 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold transition-colors"
                >
                  Nova Venda [ESC]
                </button>
              </div>

              {/* Botão de Estorno Pós-Venda (Requer Gerente) */}
              {lastCompletedSale.status !== 'canceled' && (
                <button
                  type="button"
                  disabled={isRefunding}
                  onClick={() => handleRequestRefund(lastCompletedSale)}
                  className="w-full py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                  title="Devolver itens ao estoque e cancelar a venda (Requer Gerente)"
                >
                  <RotateCcw size={13} />
                  <span>{isRefunding ? 'A Processar Estorno...' : 'Estornar Venda (Requer Gerente)'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal (Venda Feita / Pagamento Cancelado) */}
      <SaleFeedbackModal
        isOpen={feedbackModal.isOpen}
        type={feedbackModal.type}
        totalAmount={feedbackModal.totalAmount}
        changeAmount={feedbackModal.changeAmount}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Manager Authentication Modal for Protected Operations (Estorno) */}
      <ManagerAuthModal
        isOpen={isManagerAuthOpen}
        title="Autorização para Estorno de Venda"
        description="Esta operação fiscal anulará o documento de venda e devolverá todos os produtos automaticamente ao estoque no Supabase."
        onSuccess={() => {
          if (pendingRefundSale) {
            executeRefund(pendingRefundSale);
          }
        }}
        onCancel={() => {
          setIsManagerAuthOpen(false);
          setPendingRefundSale(null);
        }}
      />

      {/* Hidden printable receipt container for direct thermal printing */}
      {lastCompletedSale && (
        <ThermalReceipt
          data={{
            saleId: lastCompletedSale.id,
            invoiceNumber: lastCompletedSale.invoiceNumber,
            date: formatDateTime(lastCompletedSale.createdAt),
            customerName: lastCompletedSale.customerName,
            customerNif: lastCompletedSale.customerNif,
            items: lastCompletedSale.items.map(item => ({
              product_name: item.product.name,
              quantity: item.quantity,
              unit_price: formatKz(item.product.salePrice),
              subtotal: formatKz(item.product.salePrice * item.quantity),
            })),
            subtotal: formatKz(lastCompletedSale.subtotal),
            discount: lastCompletedSale.discount > 0 ? formatKz(lastCompletedSale.discount) : undefined,
            tax: formatKz(lastCompletedSale.tax),
            total: formatKz(lastCompletedSale.total),
            paymentMethod: lastCompletedSale.paymentMethod === 'cash' ? 'Dinheiro' : lastCompletedSale.paymentMethod === 'multicaixa' ? 'TPA / Multicaixa' : lastCompletedSale.paymentMethod === 'express' ? 'Multicaixa Express' : 'Transferência',
            amountPaid: formatKz(lastCompletedSale.total + (selectedPayment === 'cash' ? changeDue : 0)),
            changeGiven: formatKz(selectedPayment === 'cash' ? changeDue : 0),
          }}
          width="80mm"
        />
      )}
    </div>
  );
};
