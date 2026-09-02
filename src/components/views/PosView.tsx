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
  UserPlus,
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
  ShieldAlert,
  Flame,
  LayoutGrid,
  List,
  PauseCircle,
  Coins,
  History,
  Volume2,
  VolumeX,
  Layers,
  ArrowRight,
  Clock
} from 'lucide-react';
import { Product, CartItem, PaymentMethod, SaleTransaction, Customer } from '../../types';
import { formatKz, formatDateTime } from '../../utils/formatters';
import { supabaseService } from '../../services/supabaseService';
import { ThermalReceipt } from '../ThermalReceipt';
import SaleFeedbackModal from '../SaleFeedbackModal';
import CrossSellBanner, { SuggestedProduct } from '../CrossSellBanner';
import { useAuth } from '../../contexts/AuthContext';
import { ManagerAuthModal } from '../auth/ManagerAuthModal';
import { TopProductsCarousel } from './TopProductsCarousel';
import { PosShortcutsModal } from '../pdv/PosShortcutsModal';
import { PosHeldSalesDrawer, HeldSale } from '../pdv/PosHeldSalesDrawer';
import { PosRecentSalesDrawer } from '../pdv/PosRecentSalesDrawer';
import { PosQuickCustomerModal } from '../pdv/PosQuickCustomerModal';
import { PosQuickMovementModal } from '../pdv/PosQuickMovementModal';

interface PosViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  sales: SaleTransaction[];
  setSales: React.Dispatch<React.SetStateAction<SaleTransaction[]>>;
  customers: Customer[];
  setCustomers?: React.Dispatch<React.SetStateAction<Customer[]>>;
}

// Web Audio API scanner beep synthesizer for authentic POS feedback
function playPosAudio(type: 'beep' | 'success' | 'cash' | 'error' = 'beep') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'beep') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } else if (type === 'success' || type === 'cash') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    }
  } catch {
    // Audio might be blocked until user gesture
  }
}

export const PosView: React.FC<PosViewProps> = ({
  products,
  setProducts,
  sales,
  setSales,
  customers,
  setCustomers,
}) => {
  // Input search & barcode scanner state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showHighlights, setShowHighlights] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Active Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerNif, setCustomerNif] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');

  // Held (Parked) Sales State
  const [heldSales, setHeldSales] = useState<HeldSale[]>(() => {
    try {
      const saved = localStorage.getItem('masakula_pos_held_sales');
      if (saved) return JSON.parse(saved);
    } catch {
      //
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('masakula_pos_held_sales', JSON.stringify(heldSales));
    } catch {
      //
    }
  }, [heldSales]);

  // Modals & Drawers State
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isHeldSalesOpen, setIsHeldSalesOpen] = useState(false);
  const [isRecentSalesOpen, setIsRecentSalesOpen] = useState(false);
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [isQuickMovementOpen, setIsQuickMovementOpen] = useState(false);

  // Toast Banner
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

  // Card click micro-animations & image error handlers
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Record<string, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Checkout & Payment Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [paymentDocRef, setPaymentDocRef] = useState<string>('');
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitCashAmount, setSplitCashAmount] = useState<string>('');
  const [splitSecondaryMethod, setSplitSecondaryMethod] = useState<'multicaixa' | 'express' | 'transfer'>('multicaixa');

  const [lastCompletedSale, setLastCompletedSale] = useState<SaleTransaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Authentication & Refund Protection State
  const { profile } = useAuth();
  const [isManagerAuthOpen, setIsManagerAuthOpen] = useState(false);
  const [pendingRefundSale, setPendingRefundSale] = useState<SaleTransaction | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);

  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Search Input Ref
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus barcode input
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Sound helper
  const triggerAudio = (type: 'beep' | 'success' | 'cash' | 'error') => {
    if (soundEnabled) {
      playPosAudio(type);
    }
  };

  // Toast feedback helper
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

      if (stockFilter === 'in_stock' && p.stock <= 0) return false;
      if (stockFilter === 'low_stock' && (p.stock <= 0 || p.stock > p.minStock)) return false;

      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.barcode.includes(term) ||
        (p.category && p.category.toLowerCase().includes(term))
      );
    });
  }, [products, searchTerm, selectedCategory, stockFilter]);

  // Add Product to Cart
  const addToCart = (product: Product, quantityToAdd: number = 1) => {
    if (product.stock <= 0) {
      triggerAudio('error');
      showFeedback(`Produto "${product.name}" sem stock em armazém!`, 'error');
      return false;
    }

    let addedSuccessfully = true;

    setCart((prev) => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const nextQty = existing.quantity + quantityToAdd;
        if (nextQty > product.stock) {
          triggerAudio('error');
          showFeedback(`Limite de stock atingido (${product.stock} ${product.unit}).`, 'error');
          addedSuccessfully = false;
          return prev;
        }
        triggerAudio('beep');
        showFeedback(`+1 "${product.name}" no carrinho (Total: ${nextQty})`, 'success');
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: nextQty } 
            : item
        );
      }
      triggerAudio('beep');
      showFeedback(`"${product.name}" adicionado ao carrinho!`, 'success');
      return [...prev, { product, quantity: quantityToAdd }];
    });

    if (addedSuccessfully) {
      setRecentlyAddedIds(prev => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setRecentlyAddedIds(prev => ({ ...prev, [product.id]: false }));
      }, 1200);
    }

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
            triggerAudio('error');
            showFeedback(`Stock disponível: apenas ${item.product.stock} ${item.product.unit}`, 'error');
            return item;
          }
          triggerAudio('beep');
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  // Direct Quantity Change
  const setDirectQuantity = (productId: string, qty: number) => {
    setCart((prev) => {
      return prev.map(item => {
        if (item.product.id === productId) {
          if (qty <= 0) return null;
          const cappedQty = Math.min(qty, item.product.stock);
          if (qty > item.product.stock) {
            triggerAudio('error');
            showFeedback(`Ajustado para o máximo em stock (${item.product.stock})`, 'info');
          }
          return { ...item, quantity: cappedQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  // Remove from Cart
  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Hold (Park) Current Sale
  const handleHoldCurrentSale = () => {
    if (cart.length === 0) {
      showFeedback('Adicione itens ao carrinho antes de colocar a venda em espera.', 'info');
      return;
    }

    const newHeld: HeldSale = {
      id: `held-${Date.now()}`,
      heldAt: new Date().toISOString(),
      customerName: customerName.trim() || 'Consumidor Final',
      customerNif: customerNif.trim() || undefined,
      items: [...cart],
      subtotal,
      discount: discountAmount,
      total: totalPayable,
    };

    setHeldSales(prev => [newHeld, ...prev]);
    setCart([]);
    setCustomerName('');
    setCustomerNif('');
    setSelectedCustomerId(null);
    setGlobalDiscount(0);
    triggerAudio('success');
    showFeedback(`Venda de ${formatKz(totalPayable)} colocada em espera com sucesso!`, 'info');
    searchInputRef.current?.focus();
  };

  // Resume Held Sale
  const handleResumeHeldSale = (held: HeldSale) => {
    if (cart.length > 0) {
      if (!window.confirm('Existe um carrinho em aberto. Deseja substituir pelo atendimento em espera?')) {
        return;
      }
    }

    setCart(held.items);
    setCustomerName(held.customerName === 'Consumidor Final' ? '' : held.customerName);
    setCustomerNif(held.customerNif || '');
    setGlobalDiscount(held.discount > 0 ? (held.discount / held.subtotal) * 100 : 0);
    setHeldSales(prev => prev.filter(h => h.id !== held.id));
    setIsHeldSalesOpen(false);
    triggerAudio('success');
    showFeedback(`Venda de ${held.customerName} retomada no caixa!`, 'success');
  };

  // Delete Held Sale
  const handleDeleteHeldSale = (heldId: string) => {
    setHeldSales(prev => prev.filter(h => h.id !== heldId));
    showFeedback('Venda em espera removida.', 'info');
  };

  // Quick Customer Selection
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setCustomerName(customer.name);
    setCustomerNif(customer.nifOrBi || '');
    showFeedback(`Cliente "${customer.name}" associado à venda.`, 'success');
  };

  const handleClearCustomer = () => {
    setSelectedCustomerId(null);
    setCustomerName('');
    setCustomerNif('');
  };

  const handleSaveQuickCustomer = (newCust: Customer) => {
    if (setCustomers) {
      setCustomers(prev => [newCust, ...prev]);
    }
    handleSelectCustomer(newCust);
  };

  // Cancel Current Sale Before Payment
  const handleCancelOrderBeforeSale = () => {
    if (cart.length === 0 && !isCheckoutOpen) return;
    const currentTotal = totalPayable;
    setCart([]);
    setIsCheckoutOpen(false);
    setCashGiven('');
    setPaymentDocRef('');
    setIsSplitPayment(false);
    setGlobalDiscount(0);
    handleClearCustomer();

    setFeedbackModal({
      isOpen: true,
      type: 'CANCELED',
      totalAmount: currentTotal,
      changeAmount: 0,
    });
    triggerAudio('error');
    showFeedback('Atendimento cancelado e caixa pronto para nova venda.', 'info');
    searchInputRef.current?.focus();
  };

  const clearCart = handleCancelOrderBeforeSale;

  // Post-Sale Refund with Manager Authorization
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
      setPendingRefundSale(sale);
      setIsManagerAuthOpen(true);
    }
  };

  const executeRefund = async (sale: SaleTransaction) => {
    setIsRefunding(true);
    try {
      // 1. Return stock locally
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

      // 2. Mark as canceled locally
      setSales(prevSales => prevSales.map(s => s.id === sale.id ? { ...s, status: 'canceled' } : s));

      if (lastCompletedSale && lastCompletedSale.id === sale.id) {
        setLastCompletedSale(prev => prev ? { ...prev, status: 'canceled' } : null);
      }

      // 3. Sync with Supabase
      await supabaseService.cancelOrRefundSale(
        sale.id,
        sale.items.map(item => ({ productId: item.product.id, quantity: item.quantity })),
        `Estorno autorizado por ${profile?.full_name || 'Gerente'}`
      );

      triggerAudio('success');
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

      // 3. Top filtered match
      if (filteredProducts.length > 0) {
        addToCart(filteredProducts[0]);
        setSearchTerm('');
      } else {
        triggerAudio('error');
        showFeedback(`Código ou produto "${code}" não encontrado.`, 'error');
      }
    }
  };

  // Global Keyboard Shortcuts (F1 to F10, ESC)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // F1: Help / Shortcuts
      if (e.key === 'F1') {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
        return;
      }

      // F9 or Ctrl+Space: Open Checkout
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

      // F7: Cash movement
      if (e.key === 'F7') {
        e.preventDefault();
        setIsQuickMovementOpen(true);
        return;
      }

      // F8: Held sales
      if (e.key === 'F8') {
        e.preventDefault();
        setIsHeldSalesOpen(prev => !prev);
        return;
      }

      // F10: Recent sales
      if (e.key === 'F10') {
        e.preventDefault();
        setIsRecentSalesOpen(prev => !prev);
        return;
      }

      // ESC: Close Modals
      if (e.key === 'Escape') {
        if (isCheckoutOpen) {
          setIsCheckoutOpen(false);
          searchInputRef.current?.focus();
        } else if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
        } else if (isHeldSalesOpen) {
          setIsHeldSalesOpen(false);
        } else if (isRecentSalesOpen) {
          setIsRecentSalesOpen(false);
        } else if (isQuickCustomerOpen) {
          setIsQuickCustomerOpen(false);
        } else if (isQuickMovementOpen) {
          setIsQuickMovementOpen(false);
        } else if (lastCompletedSale) {
          setLastCompletedSale(null);
          searchInputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [cart, isCheckoutOpen, lastCompletedSale, isShortcutsOpen, isHeldSalesOpen, isRecentSalesOpen, isQuickCustomerOpen, isQuickMovementOpen]);

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
  const taxAmount = 0; // Regime de Exclusão / Sem IVA
  const totalPayable = taxableAmount;

  const cashGivenNum = parseFloat(cashGiven) || 0;
  const splitCashNum = parseFloat(splitCashAmount) || 0;
  const splitRemainingDue = Math.max(0, totalPayable - splitCashNum);

  const changeDue = isSplitPayment 
    ? Math.max(0, cashGivenNum - splitCashNum) 
    : Math.max(0, cashGivenNum - totalPayable);

  const isCashInsufficient = !isSplitPayment 
    ? (selectedPayment === 'cash' && cashGivenNum > 0 && cashGivenNum < totalPayable)
    : (cashGivenNum > 0 && cashGivenNum < splitCashNum);

  // Preset quick cash denominations (Kz)
  const quickCashPresets = [
    { label: 'Exato', value: isSplitPayment ? splitCashNum : totalPayable },
    { label: '+500 Kz', add: 500 },
    { label: '+1.000 Kz', add: 1000 },
    { label: '+2.000 Kz', add: 2000 },
    { label: '+5.000 Kz', add: 5000 },
    { label: '+10.000 Kz', add: 10000 },
    { label: '+20.000 Kz', add: 20000 },
  ];

  // Dynamic Cross-Sell Suggestion
  const crossSellSuggestion: SuggestedProduct | null = useMemo(() => {
    if (cart.length === 0) return null;
    const cartProductIds = new Set(cart.map((item) => item.product.id));
    
    const candidate = products.find(
      (p) => !cartProductIds.has(p.id) && p.stock > 0
    );

    if (!candidate) return null;

    return {
      id: candidate.id,
      name: candidate.name,
      price: candidate.salePrice,
    };
  }, [cart, products]);

  const handleAddCrossSell = (suggested: SuggestedProduct) => {
    const productToAdd = products.find((p) => p.id === suggested.id);
    if (productToAdd) {
      addToCart(productToAdd, 1);
    }
  };

  // Complete Sale & Process Transaction
  const handleCompleteSale = async () => {
    if (cart.length === 0 || isSubmitting) return;

    if (!isSplitPayment && selectedPayment === 'cash' && cashGivenNum < totalPayable) {
      triggerAudio('error');
      alert('O valor entregue em dinheiro é inferior ao total da venda!');
      return;
    }

    if (isSplitPayment && splitCashNum + splitRemainingDue < totalPayable) {
      triggerAudio('error');
      alert('O somatório do pagamento dividido não cobre o valor total da venda!');
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
      paymentMethod: isSplitPayment ? 'mixed' : selectedPayment,
      cashierName: profile?.full_name || 'Adilson Silva (Operador 01)',
      createdAt: new Date().toISOString(),
      status: 'paid',
    };

    // 1. Deduct stock locally
    const updatedProducts = products.map(prod => {
      const soldItem = cart.find(ci => ci.product.id === prod.id);
      if (soldItem) {
        const newStock = Math.max(0, prod.stock - soldItem.quantity);
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

    // 2. Sync sale to Supabase
    supabaseService.insertSale(newSale, {
      amountPaid: selectedPayment === 'cash' ? (cashGivenNum || totalPayable) : totalPayable,
      changeGiven: selectedPayment === 'cash' ? changeDue : 0,
    }).catch(err => console.warn('Supabase sale insert:', err));

    // 3. Finalize UI
    triggerAudio('cash');
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
    setPaymentDocRef('');
    setIsSplitPayment(false);
    setGlobalDiscount(0);
    handleClearCustomer();
    setIsSubmitting(false);

    showFeedback(`Venda finalizada com sucesso (${newSale.invoiceNumber})`, 'success');
  };

  // Payment methods
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
          className={`fixed top-4 right-8 z-50 px-4 py-2.5 rounded-2xl shadow-xl border text-xs font-black flex items-center gap-2 animate-in slide-in-from-top-3 duration-150 ${
            feedbackToast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : feedbackToast.type === 'info'
              ? 'bg-zinc-950 border-zinc-800 text-white'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}
        >
          {feedbackToast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* TOP CONTROL BAR (Terminal Status, Highlights Toggle, Sound Toggle, Held Sales, Shortcuts) */}
      <div className="mb-3 px-4 py-2 bg-white rounded-2xl border border-zinc-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-extrabold text-zinc-950">Caixa 01 • Balcão Principal</span>
          </div>
          <span className="text-zinc-300">|</span>
          <div className="flex items-center gap-1.5 text-zinc-500 font-medium">
            <Clock size={13} className="text-zinc-400" />
            <span className="font-mono">{currentTime.toLocaleTimeString('pt-AO')}</span>
          </div>
        </div>

        {/* Quick Top Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Top 10 Best Sellers Toggle */}
          <button
            type="button"
            onClick={() => setShowHighlights(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
              showHighlights 
                ? 'bg-amber-400 text-zinc-950 shadow-xs' 
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
            }`}
          >
            <Flame size={14} className={showHighlights ? 'text-zinc-950 fill-current' : 'text-amber-500'} />
            <span>Top Mais Vendidos</span>
          </button>

          {/* Held Sales Button with Badge */}
          <button
            type="button"
            onClick={() => setIsHeldSalesOpen(true)}
            className="relative px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-extrabold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Vendas Pausadas em Espera [F8]"
          >
            <PauseCircle size={14} className="text-amber-600" />
            <span>Em Espera</span>
            {heldSales.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-black">
                {heldSales.length}
              </span>
            )}
          </button>

          {/* Quick Cash Movement */}
          <button
            type="button"
            onClick={() => setIsQuickMovementOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-extrabold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Sangria ou Suprimento Rápido [F7]"
          >
            <Coins size={14} className="text-emerald-600" />
            <span>Sangria / Suprimento</span>
          </button>

          {/* Recent Sales History */}
          <button
            type="button"
            onClick={() => setIsRecentSalesOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-extrabold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Histórico de Vendas & Reimpressão [F10]"
          >
            <Receipt size={14} className="text-zinc-700" />
            <span>Últimas Vendas</span>
          </button>

          {/* View Mode Grid/List Toggle */}
          <div className="flex items-center rounded-xl bg-zinc-100 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-400 hover:text-zinc-700'
              }`}
              title="Visualização em Grelha com Fotos"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-400 hover:text-zinc-700'
              }`}
              title="Visualização em Lista Compacta"
            >
              <List size={14} />
            </button>
          </div>

          {/* Sound Mute/Unmute Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(prev => !prev)}
            className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors cursor-pointer"
            title={soundEnabled ? 'Som do Leitor Ativo' : 'Som Desativado'}
          >
            {soundEnabled ? <Volume2 size={15} className="text-emerald-600" /> : <VolumeX size={15} className="text-zinc-400" />}
          </button>

          {/* Shortcuts Info */}
          <button
            type="button"
            onClick={() => setIsShortcutsOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-black text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
            title="Guia de Atalhos [F1]"
          >
            <Keyboard size={13} />
            <span className="font-mono">F1</span>
          </button>
        </div>
      </div>

      {/* TOP HIGHLIGHTS CAROUSEL (Expandable on click) */}
      {showHighlights && (
        <div className="mb-3 animate-in fade-in slide-in-from-top-2 duration-200 shrink-0">
          <TopProductsCarousel onAddToCart={(productId) => {
            const found = products.find(p => p.id === productId);
            if (found) addToCart(found);
          }} />
        </div>
      )}

      {/* Main Split Layout: Left (8/12) Catalog & Search | Right (4/12) Active Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
        {/* =========================================================================
            LADO ESQUERDO: CATÁLOGO DE PRODUTOS & LEITOR DE CÓDIGO DE BARRAS
           ========================================================================= */}
        <div className="lg:col-span-8 flex flex-col gap-3 h-full min-h-0 overflow-hidden">
          {/* Barcode Search & Filters */}
          <div className="bg-white p-3.5 rounded-3xl border border-zinc-200/80 shadow-2xs space-y-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-zinc-400">
                  <Barcode size={18} className="text-zinc-700" />
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
                  className="w-full pl-14 pr-10 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-950 placeholder:text-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:border-transparent focus:outline-none transition-all shadow-inner"
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

              {/* Stock Filter Pills */}
              <div className="hidden sm:flex items-center gap-1 bg-zinc-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setStockFilter('all')}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    stockFilter === 'all' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('in_stock')}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    stockFilter === 'in_stock' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  Em Stock
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('low_stock')}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    stockFilter === 'low_stock' ? 'bg-white text-amber-800 shadow-2xs' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  Baixo Stock
                </button>
              </div>
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
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-zinc-950 text-white shadow-xs'
                        : 'bg-zinc-100/90 text-zinc-600 hover:bg-zinc-200/90'
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

          {/* Product Items: Grid View or Dense Table View */}
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
            {filteredProducts.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-zinc-200/80 p-6">
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
                    setStockFilter('all');
                    searchInputRef.current?.focus();
                  }}
                  className="mt-3 px-4 py-2 rounded-xl bg-zinc-950 text-white text-xs font-bold cursor-pointer hover:bg-zinc-800"
                >
                  Limpar Todos os Filtros
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              /* GRID CARDS VIEW */
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pb-2">
                {filteredProducts.map((product) => {
                  const isOut = product.stock <= 0;
                  const isLow = product.stock <= product.minStock;
                  const inCartItem = cart.find(ci => ci.product.id === product.id);
                  const isJustAdded = !!recentlyAddedIds[product.id];
                  const hasImageError = !!imageErrors[product.id];
                  const imageSrc = !hasImageError && product.imageUrl ? product.imageUrl : null;

                  return (
                    <div
                      key={product.id}
                      onClick={() => !isOut && addToCart(product)}
                      className={`group relative p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between select-none ${
                        isOut
                          ? 'bg-zinc-50/60 border-zinc-200 opacity-60 cursor-not-allowed'
                          : isJustAdded
                          ? 'bg-emerald-50/80 border-[#32D583] shadow-md ring-2 ring-[#32D583]/40 scale-[0.98] cursor-pointer'
                          : inCartItem
                          ? 'bg-emerald-50/30 border-emerald-300 shadow-xs hover:shadow-md cursor-pointer active:scale-[0.98]'
                          : 'bg-white border-zinc-200/80 hover:border-zinc-300 hover:shadow-md cursor-pointer active:scale-[0.98]'
                      }`}
                    >
                      {/* In-cart indicator badge */}
                      {inCartItem && (
                        <div className="absolute -top-2 -right-2 bg-emerald-600 text-white w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center shadow-md border-2 border-white animate-in zoom-in-50 duration-200 z-10">
                          {inCartItem.quantity}
                        </div>
                      )}

                      <div>
                        {/* Top Category & Stock Badge */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-black text-zinc-400 truncate max-w-[90px] uppercase tracking-wider">
                            {product.category || 'Geral'}
                          </span>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded-md shrink-0 ${
                              isOut
                                ? 'bg-rose-100 text-rose-700'
                                : isLow
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isOut ? 'Esgotado' : `${product.stock} ${product.unit || 'un'}`}
                          </span>
                        </div>

                        {/* Product Image */}
                        <div className="relative w-full h-24 mb-2 flex items-center justify-center rounded-xl bg-zinc-50/80 p-1.5 group-hover:bg-zinc-100/70 transition-colors">
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={product.name}
                              referrerPolicy="no-referrer"
                              onError={() => setImageErrors(prev => ({ ...prev, [product.id]: true }))}
                              className="max-h-20 w-auto object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110 pointer-events-none"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-400 font-black text-base border border-zinc-200/60 shadow-2xs">
                              {product.name ? product.name.charAt(0).toUpperCase() : 'P'}
                            </div>
                          )}
                        </div>

                        {/* Title & SKU */}
                        <h4 className="font-bold text-xs text-zinc-950 line-clamp-2 leading-snug" title={product.name}>
                          {product.name}
                        </h4>
                        
                        <p className="text-[10px] font-mono text-zinc-400 mt-1 flex items-center gap-1">
                          <Barcode size={11} />
                          <span className="truncate">{product.barcode || product.sku}</span>
                        </p>
                      </div>

                      {/* Price & Quick Add Button */}
                      <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between">
                        <div>
                          <span className="font-black text-xs text-zinc-950 block">
                            {formatKz(product.salePrice)}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={isOut}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isOut) addToCart(product);
                          }}
                          className={`flex items-center justify-center transition-all duration-200 cursor-pointer ${
                            isOut
                              ? 'w-7 h-7 rounded-xl bg-zinc-200 text-zinc-400 cursor-not-allowed'
                              : isJustAdded
                              ? 'px-2.5 h-7 rounded-xl bg-[#32D583] text-zinc-950 font-black text-[11px] gap-1 shadow-sm scale-105'
                              : inCartItem
                              ? 'w-7 h-7 rounded-xl bg-emerald-600 hover:bg-[#32D583] hover:text-zinc-950 text-white'
                              : 'w-7 h-7 rounded-xl bg-zinc-950 hover:bg-[#32D583] hover:text-zinc-950 text-white active:scale-90'
                          }`}
                        >
                          {isJustAdded ? (
                            <>
                              <Check size={13} className="stroke-[3]" />
                              <span className="text-[10px]">Add</span>
                            </>
                          ) : (
                            <Plus size={15} className="stroke-[2.5]" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* COMPACT TABLE DENSE LIST VIEW */
              <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 uppercase font-black text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">Artigo</th>
                      <th className="p-3">Código</th>
                      <th className="p-3">Categoria</th>
                      <th className="p-3 text-right">Stock</th>
                      <th className="p-3 text-right">Preço Unit.</th>
                      <th className="p-3 text-center">Adicionar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredProducts.map((product) => {
                      const isOut = product.stock <= 0;
                      const isLow = product.stock <= product.minStock;
                      const inCartItem = cart.find(ci => ci.product.id === product.id);

                      return (
                        <tr
                          key={product.id}
                          onClick={() => !isOut && addToCart(product)}
                          className={`transition-colors cursor-pointer ${
                            isOut
                              ? 'opacity-50 bg-zinc-50/50'
                              : inCartItem
                              ? 'bg-emerald-50/40 hover:bg-emerald-50/70'
                              : 'hover:bg-zinc-50'
                          }`}
                        >
                          <td className="p-3 font-bold text-zinc-900 flex items-center gap-2">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt="" className="w-7 h-7 object-contain rounded-md" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-7 h-7 rounded-md bg-zinc-100 text-zinc-500 font-bold flex items-center justify-center text-[11px]">
                                {product.name.charAt(0)}
                              </div>
                            )}
                            <span className="truncate max-w-xs">{product.name}</span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-zinc-400">{product.barcode || product.sku}</td>
                          <td className="p-3 text-zinc-500">{product.category || 'Geral'}</td>
                          <td className="p-3 text-right">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              isOut ? 'bg-rose-100 text-rose-700' : isLow ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {product.stock} {product.unit}
                            </span>
                          </td>
                          <td className="p-3 text-right font-black text-zinc-950">{formatKz(product.salePrice)}</td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              disabled={isOut}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isOut) addToCart(product);
                              }}
                              className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white font-bold transition-all disabled:bg-zinc-200 disabled:text-zinc-400 cursor-pointer"
                            >
                              <Plus size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            LADO DIREITO: CARRINHO DE COMPRAS ATIVO, CLIENTE & CHECKOUT
           ========================================================================= */}
        <div className="lg:col-span-4 flex flex-col h-full bg-white rounded-3xl border border-zinc-200/80 shadow-2xs p-4 justify-between min-h-0 overflow-hidden">
          {/* Cart Header */}
          <div className="space-y-2.5 pb-3 border-b border-zinc-100 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center shadow-xs">
                  <ShoppingCart size={16} />
                </div>
                <div>
                  <h3 className="font-black text-xs text-zinc-950">Talão / Atendimento</h3>
                  <p className="text-[10px] text-zinc-400">
                    {cart.reduce((acc, ci) => acc + ci.quantity, 0)} {cart.length === 1 ? 'artigo' : 'artigos'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Hold Sale Button */}
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={handleHoldCurrentSale}
                    className="px-2 py-1 rounded-lg text-[10px] font-black text-amber-700 bg-amber-50 hover:bg-amber-100 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Pausar Venda para Atender Outro Cliente"
                  >
                    <PauseCircle size={12} />
                    <span>Pausar</span>
                  </button>
                )}

                {/* Clear Cart Button */}
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="px-2 py-1 rounded-lg text-[10px] font-black text-rose-600 hover:bg-rose-50 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Limpar Carrinho [F4]"
                  >
                    <Trash2 size={12} />
                    <span>Limpar [F4]</span>
                  </button>
                )}
              </div>
            </div>

            {/* Customer Identification & Fast Select */}
            <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-wider flex items-center gap-1">
                  <User size={12} className="text-zinc-500" />
                  Cliente na Fatura
                </span>
                <button
                  type="button"
                  onClick={() => setIsQuickCustomerOpen(true)}
                  className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <UserPlus size={11} />
                  <span>+ Novo Cliente</span>
                </button>
              </div>

              {/* Customer Selector dropdown / input */}
              <div className="space-y-1.5">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nome do Cliente (deixe vazio para Consumidor Final)"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (selectedCustomerId) setSelectedCustomerId(null);
                    }}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  />
                  {customerName && (
                    <button
                      type="button"
                      onClick={handleClearCustomer}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="NIF (Opcional - ex: 5417082910)"
                    value={customerNif}
                    onChange={(e) => setCustomerNif(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto py-2.5 space-y-2 custom-scrollbar min-h-0">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 p-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-50 text-zinc-300 flex items-center justify-center mb-2 shadow-2xs">
                  <ShoppingCart size={24} />
                </div>
                <p className="text-xs font-black text-zinc-700">Carrinho Vazio</p>
                <p className="text-[11px] text-zinc-400 mt-0.5 max-w-[200px]">
                  Passe os códigos de barras no scanner ou clique nos produtos do catálogo à esquerda.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="p-2.5 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between gap-2.5 text-xs hover:bg-zinc-100/80 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200/80 flex items-center justify-center shrink-0 p-1 overflow-hidden shadow-2xs">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="max-h-8 w-auto object-contain pointer-events-none"
                      />
                    ) : (
                      <span className="font-black text-xs text-zinc-400">
                        {item.product.name ? item.product.name.charAt(0).toUpperCase() : 'P'}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-zinc-900 truncate leading-tight">{item.product.name}</h5>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-zinc-500 font-semibold">
                        {formatKz(item.product.salePrice)}
                      </span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-200/60 font-mono text-zinc-600">
                        {item.product.unit || 'un'}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-xl border border-zinc-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="font-black text-zinc-950 px-1 text-xs">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
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
                    className="text-zinc-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remover item"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Cross Sell Suggestion */}
          {cart.length > 0 && crossSellSuggestion && (
            <div className="pb-1 shrink-0">
              <CrossSellBanner
                suggestion={crossSellSuggestion}
                onAddToCart={handleAddCrossSell}
              />
            </div>
          )}

          {/* Cart Calculation & Checkout Trigger */}
          <div className="pt-2.5 border-t border-zinc-100 space-y-2.5 shrink-0">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-500 font-semibold">
                <span>Subtotal:</span>
                <span className="font-bold text-zinc-800">{formatKz(subtotal)}</span>
              </div>

              {/* Discount Selector */}
              <div className="flex justify-between items-center text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Tag size={12} className="text-rose-500" />
                  <span className="font-semibold">Desconto:</span>
                  <div className="inline-flex rounded-lg bg-zinc-100 p-0.5">
                    <button
                      type="button"
                      onClick={() => setDiscountType('percent')}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-black cursor-pointer ${
                        discountType === 'percent' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500'
                      }`}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('fixed')}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-black cursor-pointer ${
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
                    className="w-14 px-1.5 py-0.5 rounded-lg bg-zinc-100 text-center font-black text-zinc-900 text-[11px] focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  />
                </span>
                <span className="font-black text-rose-600">
                  {discountAmount > 0 ? `-${formatKz(discountAmount)}` : '0 Kz'}
                </span>
              </div>

              {/* Total Final */}
              <div className="flex justify-between items-center text-sm font-black text-zinc-950 pt-1.5 border-t border-zinc-100">
                <span>Total a Pagar:</span>
                <span className="text-emerald-700 text-lg font-black">{formatKz(totalPayable)}</span>
              </div>
            </div>

            {/* Primary Action: Cobrar [F9 / F2] */}
            <button
              id="btn-pos-checkout"
              type="button"
              disabled={cart.length === 0}
              onClick={() => setIsCheckoutOpen(true)}
              className={`w-full py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${
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

      {/* =========================================================================
          MODAL DE FINALIZAÇÃO DE VENDA & CHECKOUT (MULTIPAGAMENTO & TROCO)
         ========================================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200/80 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="font-black text-base text-zinc-950">Finalizar Venda & Cobrança</h3>
                <p className="text-[11px] text-zinc-400">
                  Cliente: <span className="font-bold text-zinc-800">{customerName || 'Consumidor Final'}</span> {customerNif && `(NIF: ${customerNif})`}
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

            {/* Total Card */}
            <div className="p-4 rounded-2xl bg-zinc-950 text-white text-center space-y-1 shadow-inner">
              <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider">Total a Cobrar</span>
              <div className="text-3xl font-black text-emerald-400">{formatKz(totalPayable)}</div>
              <div className="text-[11px] text-zinc-400">
                Subtotal: {formatKz(subtotal)} {discountAmount > 0 && `• Desconto: -${formatKz(discountAmount)}`}
              </div>
            </div>

            {/* Split Payment Toggle */}
            <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-2xl border border-zinc-200/60">
              <span className="font-bold text-zinc-800 text-xs flex items-center gap-1.5">
                <Layers size={14} className="text-zinc-500" />
                Pagamento Dividido / Misto (Dinheiro + TPA)
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsSplitPayment(prev => !prev);
                  if (!isSplitPayment) {
                    setSplitCashAmount(String(Math.floor(totalPayable / 2)));
                  }
                }}
                className={`px-3 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                  isSplitPayment ? 'bg-zinc-950 text-white' : 'bg-zinc-200 text-zinc-700'
                }`}
              >
                {isSplitPayment ? 'Ativo' : 'Ativar'}
              </button>
            </div>

            {/* Payment Method Selector (Single Mode) */}
            {!isSplitPayment ? (
              <div className="space-y-2">
                <label className="font-bold text-zinc-700 block text-xs">Forma de Pagamento</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {paymentMethods.map((m) => {
                    const Icon = m.icon;
                    const isSelected = selectedPayment === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedPayment(m.id)}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-950 text-white border-zinc-950 shadow-md scale-102'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300'
                        }`}
                      >
                        <Icon size={18} className={isSelected ? 'text-emerald-400' : 'text-zinc-600'} />
                        <div>
                          <span className="font-bold text-xs block leading-tight">{m.label}</span>
                          <span className="text-[9px] text-zinc-400 block">{m.sub}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* SPLIT PAYMENT CONTROLS */
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-zinc-800 text-xs block mb-1">1. Parcela em Dinheiro (Kz)</label>
                    <input
                      type="number"
                      value={splitCashAmount}
                      onChange={(e) => setSplitCashAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl font-black text-sm text-zinc-950 focus:ring-1 focus:ring-zinc-950"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-zinc-800 text-xs block mb-1">2. Restante em Cartão/Outro (Kz)</label>
                    <div className="w-full px-3 py-2 bg-zinc-200/80 border border-zinc-300 rounded-xl font-black text-sm text-zinc-950">
                      {formatKz(splitRemainingDue)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cash Given & Change Calculation */}
            {(selectedPayment === 'cash' || isSplitPayment) && (
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-zinc-800 text-xs">Valor Entregue pelo Cliente em Cédulas (Kz)</label>
                    <span className="text-[10px] text-zinc-400">Notas em Kwanzas</span>
                  </div>
                  <input
                    type="number"
                    autoFocus
                    placeholder={`Ex: ${isSplitPayment ? splitCashNum : totalPayable}`}
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (!isCashInsufficient || cashGivenNum >= totalPayable)) {
                        handleCompleteSale();
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-zinc-300 text-zinc-950 font-black text-base focus:outline-none focus:ring-2 focus:ring-zinc-950"
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
                      className="px-2.5 py-1 rounded-xl bg-white hover:bg-zinc-200 border border-zinc-200 text-zinc-800 font-bold text-[11px] transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Change Warning/Box */}
                {isCashInsufficient ? (
                  <div className="p-2.5 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-between text-rose-800 font-bold text-xs">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle size={14} />
                      Valor insuficiente
                    </span>
                    <span>Faltam {formatKz((isSplitPayment ? splitCashNum : totalPayable) - cashGivenNum)}</span>
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
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCancelOrderBeforeSale}
                className="px-3.5 py-2.5 rounded-2xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-black flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Cancelar atendimento, limpar itens e resetar formulário"
              >
                <Trash2 size={14} />
                <span>Cancelar Atendimento</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold cursor-pointer"
                >
                  Voltar [ESC]
                </button>

                <button
                  id="btn-confirm-pos-sale"
                  type="button"
                  disabled={isSubmitting || (!isSplitPayment && selectedPayment === 'cash' && cashGivenNum < totalPayable)}
                  onClick={handleCompleteSale}
                  className={`px-5 py-2.5 rounded-2xl font-black shadow-sm flex items-center gap-2 transition-all cursor-pointer ${
                    isSubmitting || (!isSplitPayment && selectedPayment === 'cash' && cashGivenNum < totalPayable)
                      ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-zinc-950 active:scale-98'
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
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200/80 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
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
            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 font-mono text-[10px] text-zinc-800 space-y-2.5 shadow-inner relative">
              {lastCompletedSale.status === 'canceled' && (
                <div className="absolute inset-0 bg-rose-50/80 backdrop-blur-[1px] rounded-2xl flex items-center justify-center pointer-events-none">
                  <span className="border-2 border-rose-600 text-rose-600 font-black text-base px-4 py-1 rounded-xl rotate-[-12deg] uppercase tracking-widest">
                    ANULADO / ESTORNO
                  </span>
                </div>
              )}
              <div className="text-center border-b border-dashed border-zinc-300 pb-2">
                <p className="font-black text-zinc-950 text-[11px]">MASAKULA TECH & RETAIL</p>
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
              <div className="border-t border-b border-dashed border-zinc-300 py-1.5 space-y-1">
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
                <div className="flex justify-between font-black text-xs text-zinc-950 pt-1 border-t border-zinc-300">
                  <span>TOTAL KZ:</span>
                  <span>{formatKz(lastCompletedSale.total)}</span>
                </div>
                <div className="flex justify-between text-[9px] text-zinc-500 pt-0.5">
                  <span>Meio de Pagamento:</span>
                  <span className="uppercase font-bold">{lastCompletedSale.paymentMethod}</span>
                </div>
              </div>

              {/* AGT Certification Footer */}
              <div className="text-center text-[9px] text-zinc-400 pt-2 border-t border-dashed border-zinc-300 space-y-0.5">
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
                  className="flex-1 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
                  className="flex-1 py-2.5 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold transition-colors cursor-pointer"
                >
                  Nova Venda [ESC]
                </button>
              </div>

              {/* Refund Action (Manager Role Protected) */}
              {lastCompletedSale.status !== 'canceled' && (
                <button
                  type="button"
                  disabled={isRefunding}
                  onClick={() => handleRequestRefund(lastCompletedSale)}
                  className="w-full py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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

      {/* Held Sales Drawer */}
      <PosHeldSalesDrawer
        isOpen={isHeldSalesOpen}
        onClose={() => setIsHeldSalesOpen(false)}
        heldSales={heldSales}
        onResumeSale={handleResumeHeldSale}
        onDeleteHeldSale={handleDeleteHeldSale}
      />

      {/* Recent Sales Drawer */}
      <PosRecentSalesDrawer
        isOpen={isRecentSalesOpen}
        onClose={() => setIsRecentSalesOpen(false)}
        sales={sales}
        onReprintSale={(sale) => {
          setLastCompletedSale(sale);
          setIsRecentSalesOpen(false);
        }}
        onRequestRefund={(sale) => {
          setIsRecentSalesOpen(false);
          handleRequestRefund(sale);
        }}
      />

      {/* Quick Customer Modal */}
      <PosQuickCustomerModal
        isOpen={isQuickCustomerOpen}
        onClose={() => setIsQuickCustomerOpen(false)}
        onSaveCustomer={handleSaveQuickCustomer}
      />

      {/* Quick Movement Modal */}
      <PosQuickMovementModal
        isOpen={isQuickMovementOpen}
        onClose={() => setIsQuickMovementOpen(false)}
        onSubmitMovement={async (type, amount, reason) => {
          try {
            await supabaseService.insertCashMovement({
              session_id: 'active-session-01',
              type,
              amount,
              reason,
            });
            triggerAudio('cash');
            showFeedback(`${type === 'SANGRIA' ? 'Sangria' : 'Suprimento'} de ${formatKz(amount)} registado!`, 'success');
          } catch (e) {
            showFeedback('Erro ao comunicar movimento com o banco.', 'error');
          }
        }}
      />

      {/* Keyboard Shortcuts Modal */}
      <PosShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

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
            paymentMethod: lastCompletedSale.paymentMethod === 'cash' ? 'Dinheiro' : lastCompletedSale.paymentMethod === 'multicaixa' ? 'TPA / Multicaixa' : lastCompletedSale.paymentMethod === 'express' ? 'Multicaixa Express' : lastCompletedSale.paymentMethod === 'mixed' ? 'Pagamento Misto' : 'Transferência',
            amountPaid: formatKz(lastCompletedSale.total + (selectedPayment === 'cash' ? changeDue : 0)),
            changeGiven: formatKz(selectedPayment === 'cash' ? changeDue : 0),
          }}
          width="80mm"
        />
      )}
    </div>
  );
};
export default PosView;
