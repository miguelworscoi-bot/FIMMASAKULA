import React, { useState } from 'react';
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
  Sparkles, 
  X,
  Receipt,
  Percent
} from 'lucide-react';
import { Product, CartItem, PaymentMethod, SaleTransaction, Customer } from '../../types';
import { formatKz, formatDateTime } from '../../utils/formatters';

interface PosViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  sales: SaleTransaction[];
  setSales: React.Dispatch<React.SetStateAction<SaleTransaction[]>>;
  customers: Customer[];
}

export const PosView: React.FC<PosViewProps> = ({
  products,
  setProducts,
  sales,
  setSales,
  customers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Consumidor Final');
  const [customerNif, setCustomerNif] = useState('');
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  
  // Checkout & Payment Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('multicaixa');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [lastCompletedSale, setLastCompletedSale] = useState<SaleTransaction | null>(null);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const availableProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('Produto esgotado em armazém!');
      return;
    }

    setCart((prev) => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Quantidade máxima em stock (${product.stock} un.) atingida!`);
          return prev;
        }
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.product.stock) {
            alert(`Stock disponível: ${item.product.stock} un.`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    if (cart.length > 0 && window.confirm('Deseja limpar todo o carrinho de compras?')) {
      setCart([]);
    }
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.product.salePrice * item.quantity), 0);
  const discountAmount = (subtotal * globalDiscount) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * 0.14; // IVA 14% Angola
  const totalPayable = taxableAmount + taxAmount;

  const cashGivenNum = parseFloat(cashGiven) || 0;
  const changeDue = Math.max(0, cashGivenNum - totalPayable);

  const handleCompleteSale = () => {
    if (cart.length === 0) return;

    if (selectedPayment === 'cash' && cashGivenNum < totalPayable) {
      alert('O valor entregue em dinheiro é inferior ao total a pagar!');
      return;
    }

    const nextInvoiceNum = `FT MAS26/${String(sales.length + 483).padStart(5, '0')}`;
    
    const newSale: SaleTransaction = {
      id: `sale-${Date.now()}`,
      invoiceNumber: nextInvoiceNum,
      customerName: customerName || 'Consumidor Final',
      customerNif: customerNif || undefined,
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

    // Deduct stock
    setProducts(prev => prev.map(prod => {
      const soldItem = cart.find(ci => ci.product.id === prod.id);
      if (soldItem) {
        const newStock = Math.max(0, prod.stock - soldItem.quantity);
        return {
          ...prod,
          stock: newStock,
          status: newStock === 0 ? 'out_of_stock' : newStock <= prod.minStock ? 'low_stock' : 'active',
        };
      }
      return prod;
    }));

    setSales(prev => [newSale, ...prev]);
    setLastCompletedSale(newSale);
    setCart([]);
    setIsCheckoutOpen(false);
    setCashGiven('');
  };

  return (
    <div id="view-pos" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200 h-[calc(100vh-140px)]">
      {/* Left Column: Catalog & Barcode Search (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col gap-4 h-full overflow-hidden">
        {/* Search & Category Header */}
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs space-y-3 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              id="pos-search-input"
              type="text"
              placeholder="Pesquisar produto por nome, SKU ou leitor de código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-50 border border-gray-200 text-xs text-zinc-800 focus:bg-white focus:ring-2 focus:ring-zinc-950 focus:outline-none"
            />
          </div>

          {/* Category Carousel Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'bg-zinc-100/70 text-zinc-600 hover:bg-zinc-200/70'
                }`}
              >
                {cat === 'all' ? 'Todos' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {availableProducts.map((product) => {
              const isOut = product.stock <= 0;
              const isLow = product.stock <= product.minStock;

              return (
                <div
                  key={product.id}
                  onClick={() => !isOut && addToCart(product)}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between select-none ${
                    isOut
                      ? 'bg-zinc-100/70 border-gray-200 opacity-60 cursor-not-allowed'
                      : 'bg-white border-gray-100 hover:border-zinc-300 hover:shadow-md cursor-pointer active:scale-95'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-zinc-400 truncate max-w-[80px]">
                        {product.category}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                          isOut
                            ? 'bg-rose-100 text-rose-700'
                            : isLow
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {product.stock} {product.unit}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-zinc-900 line-clamp-2 leading-snug">
                      {product.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="font-black text-xs text-zinc-950">
                      {formatKz(product.salePrice)}
                    </span>
                    <div className="w-6 h-6 rounded-lg bg-zinc-950 text-white flex items-center justify-center">
                      <Plus size={14} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Active POS Cart & Billing (5 Cols) */}
      <div className="lg:col-span-5 flex flex-col h-full bg-white rounded-3xl border border-gray-100 shadow-xs p-5 justify-between overflow-hidden">
        {/* Customer Header Info */}
        <div className="space-y-3 pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
              <ShoppingCart size={16} className="text-emerald-500" />
              <span>Venda / Talão em Curso</span>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1"
              >
                <Trash2 size={12} /> Limpar
              </button>
            )}
          </div>

          {/* Customer Selection in PDV */}
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
                className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-50 border border-gray-200 text-zinc-800 text-xs font-medium focus:outline-none"
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
                className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-50 border border-gray-200 text-zinc-800 text-xs font-medium focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 p-4">
              <ShoppingCart size={32} className="text-zinc-200 mb-2" />
              <p className="text-xs font-semibold text-zinc-600">Carrinho Vazio</p>
              <p className="text-[11px]">Clique nos produtos à esquerda para faturar.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-2.5 rounded-2xl bg-zinc-50 border border-gray-100 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1 truncate">
                  <h5 className="font-bold text-zinc-900 truncate">{item.product.name}</h5>
                  <span className="text-[11px] text-zinc-500">
                    {formatKz(item.product.salePrice)} / {item.product.unit}
                  </span>
                </div>

                {/* Qty Stepper */}
                <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="text-zinc-500 hover:text-zinc-950"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="font-bold text-zinc-950 px-1">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="text-zinc-500 hover:text-zinc-950"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Line Total */}
                <div className="text-right shrink-0">
                  <span className="font-bold text-zinc-950 block">
                    {formatKz(item.product.salePrice * item.quantity)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-zinc-400 hover:text-rose-600 p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Calculation & Final Checkout Trigger */}
        <div className="pt-3 border-t border-gray-100 space-y-3 shrink-0">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-zinc-500">
              <span>Subtotal:</span>
              <span className="font-medium text-zinc-800">{formatKz(subtotal)}</span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span className="flex items-center gap-1">
                Desconto (%):
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={globalDiscount}
                  onChange={(e) => setGlobalDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-12 px-1 py-0.5 rounded bg-zinc-100 text-center font-bold text-zinc-800 text-[10px]"
                />
              </span>
              <span className="font-medium text-rose-600">-{formatKz(discountAmount)}</span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span>IVA Geral (14%):</span>
              <span className="font-medium text-zinc-800">{formatKz(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-zinc-950 pt-2 border-t border-gray-100">
              <span>Total a Cobrar:</span>
              <span className="text-emerald-600 text-base">{formatKz(totalPayable)}</span>
            </div>
          </div>

          <button
            id="btn-pos-checkout"
            type="button"
            disabled={cart.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
            className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${
              cart.length === 0
                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                : 'bg-zinc-950 hover:bg-zinc-800 text-white shadow-emerald-900/20 active:scale-98'
            }`}
          >
            <CreditCard size={16} className="text-emerald-400" />
            <span>Cobrar {formatKz(totalPayable)}</span>
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-base text-zinc-950">Finalizar Pagamento</h3>
                <p className="text-[11px] text-zinc-400">Selecione o meio de pagamento e emita a fatura</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-800"
              >
                <X size={16} />
              </button>
            </div>

            {/* Total Payable Display */}
            <div className="p-4 rounded-2xl bg-zinc-950 text-white text-center space-y-0.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold">Total da Fatura</span>
              <div className="text-2xl font-black text-emerald-400">{formatKz(totalPayable)}</div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="font-bold text-zinc-700 block">Meio de Pagamento</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'multicaixa', label: 'TPA / Multicaixa', icon: CreditCard },
                  { id: 'cash', label: 'Dinheiro', icon: Banknote },
                  { id: 'transfer', label: 'Express / Transf.', icon: Send },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedPayment(m.id as PaymentMethod)}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                        selectedPayment === m.id
                          ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                          : 'bg-zinc-50 border-gray-200 text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="font-semibold text-[11px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash change calculator if Dinheiro is selected */}
            {selectedPayment === 'cash' && (
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-gray-200 space-y-2">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-700">Valor Entregue pelo Cliente (Kz)</label>
                  <input
                    type="number"
                    placeholder="Ex: 50000"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-zinc-900 font-bold focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  />
                </div>
                <div className="flex justify-between items-center pt-2 text-xs font-bold">
                  <span className="text-zinc-500">Troco a Devolver:</span>
                  <span className="text-emerald-600 font-black text-sm">{formatKz(changeDue)}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="px-4 py-2.5 rounded-2xl border border-gray-200 text-zinc-700 hover:bg-zinc-50 font-semibold"
              >
                Voltar
              </button>
              <button
                id="btn-confirm-pos-sale"
                type="button"
                onClick={handleCompleteSale}
                className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 size={16} />
                <span>Confirmar & Emitir Talão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Success & AGT Thermal Receipt Modal */}
      {lastCompletedSale && (
        <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="font-extrabold text-base text-zinc-950">Venda Concluída!</h3>
              <p className="text-zinc-500 text-[11px]">Talão emitido e transmitido com sucesso</p>
            </div>

            {/* Simulated Thermal Slip Preview */}
            <div className="bg-zinc-50 p-4 rounded-2xl border border-gray-200 font-mono text-[10px] text-zinc-700 space-y-2">
              <div className="text-center border-b border-gray-200 pb-2">
                <p className="font-bold text-zinc-900">MASAKULA TECH & RETAIL</p>
                <p>NIF: 5417082910</p>
                <p>Luanda, Angola</p>
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>DOC: {lastCompletedSale.invoiceNumber}</span>
                  <span>{formatDateTime(lastCompletedSale.createdAt)}</span>
                </div>
                <div>Cliente: {lastCompletedSale.customerName}</div>
                {lastCompletedSale.customerNif && <div>NIF: {lastCompletedSale.customerNif}</div>}
              </div>

              <div className="border-t border-b border-gray-200 py-1.5 space-y-1">
                {lastCompletedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate max-w-[160px]">{item.quantity}x {item.product.name}</span>
                    <span>{formatKz(item.product.salePrice * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-0.5 text-right font-semibold">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatKz(lastCompletedSale.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA (14%):</span>
                  <span>{formatKz(lastCompletedSale.tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-xs text-zinc-950 pt-1 border-t border-gray-200">
                  <span>TOTAL KZ:</span>
                  <span>{formatKz(lastCompletedSale.total)}</span>
                </div>
              </div>

              <div className="text-center text-[9px] text-zinc-400 pt-2 border-t border-gray-200">
                <p>AGT-CERT/2026/8920 • Software Certificado</p>
                <p className="font-bold">Obrigado pela preferência!</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  alert('Imprimindo talão na impressora térmica 80mm...');
                }}
                className="flex-1 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold flex items-center justify-center gap-1.5"
              >
                <Printer size={14} />
                <span>Imprimir Talão</span>
              </button>
              <button
                type="button"
                onClick={() => setLastCompletedSale(null)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-950 text-white font-semibold"
              >
                Nova Venda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
