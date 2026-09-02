"use client";

import React, { useMemo, useState } from "react";
import { Search, Package } from "lucide-react";
import { POSProduct, CartItem, PaymentMethod } from "@/types/pos";
import { POSCartSidebar } from "../components/pdv/POSCartSidebar";
import { POSCheckoutModal } from "../components/pdv/POSCheckoutModal";

const MOCK_PRODUCTS: POSProduct[] = [
  { id: "1", name: "Água Mineral 1.5L", price: 500, stock: 45, categoryId: "cat1", categoryName: "Bebidas", categoryColor: "#06B6D4" },
  { id: "2", name: "Sumo Compal Laranja 1L", price: 1200, stock: 18, categoryId: "cat1", categoryName: "Bebidas", categoryColor: "#06B6D4" },
  { id: "3", name: "Café Expresso", price: 400, stock: 100, categoryId: "cat2", categoryName: "Alimentação", categoryColor: "#F59E0B" },
  { id: "4", name: "Sanduíche Mista", price: 1500, stock: 12, categoryId: "cat2", categoryName: "Alimentação", categoryColor: "#F59E0B" },
];

export default function POSPage() {
  const [products] = useState<POSProduct[]>(MOCK_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const categories = useMemo(() => {
    return Array.from(
      new Map(
        products
          .filter((product) => product.categoryId)
          .map((product) => [product.categoryId, {
            id: product.categoryId as string,
            name: product.categoryName ?? "Sem categoria",
            color: product.categoryColor ?? "#32D583",
          }])
      ).values()
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(normalizedSearch)
        || product.barcode?.includes(normalizedSearch);
      const matchesCategory = selectedCategory === null || product.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleAddToCart = (product: POSProduct) => {
    if (product.stock <= 0) return;

    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.product.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) return currentCart;
        const quantity = existingItem.quantity + 1;
        return currentCart.map((item) => item.product.id === product.id
          ? { ...item, quantity, subtotal: quantity * product.price }
          : item);
      }
      return [...currentCart, { product, quantity: 1, subtotal: product.price }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((currentCart) => currentCart.flatMap((item) => {
      if (item.product.id !== productId) return [item];
      const quantity = item.quantity + delta;
      if (quantity <= 0) return [];
      if (quantity > item.product.stock) return [item];
      return [{ ...item, quantity, subtotal: quantity * item.product.price }];
    }));
  };

  const handleConfirmSale = async (method: PaymentMethod, paid: number, change: number) => {
    console.log("Venda efetuada:", { cart, method, paid, change });
    setCart([]);
    setIsCheckoutOpen(false);
  };

  const totalAmount = cart.reduce((total, item) => total + item.subtotal, 0);

  return (
    <div className="flex h-screen gap-4 overflow-hidden bg-[#0b0b0b] p-4 font-sans text-white">
      <div className="flex min-w-0 flex-1 flex-col space-y-4 overflow-hidden">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-500" />
          <input
            type="search"
            placeholder="Pesquisar produto por nome ou código de barras..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-[#131313] py-3 pl-11 pr-4 text-xs text-white placeholder-gray-500 focus:border-[#32D583] focus:outline-none"
            aria-label="Pesquisar produtos"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition ${selectedCategory === null ? "bg-white font-bold text-black" : "border border-white/10 bg-[#131313] text-gray-400 hover:text-white"}`}
          >
            Todos os Produtos
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition ${selectedCategory === category.id ? "bg-[#32D583] font-bold text-black" : "border border-white/10 bg-[#131313] text-gray-300 hover:bg-white/5"}`}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
              {category.name}
            </button>
          ))}
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 sm:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              disabled={product.stock <= 0}
              onClick={() => handleAddToCart(product)}
              className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#131313] p-4 text-left transition hover:border-[#32D583]/50 hover:bg-[#181818] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="space-y-1">
                <span className="font-mono text-[10px] text-gray-500">Stock: {product.stock}</span>
                <h4 className="truncate text-xs font-bold text-white transition group-hover:text-[#32D583]">{product.name}</h4>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-mono text-xs font-extrabold text-[#32D583]">{product.price.toLocaleString("pt-AO")} Kz</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/5 transition group-hover:bg-[#32D583] group-hover:text-black">
                  <Package className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="h-full w-80 shrink-0 lg:w-96">
        <POSCartSidebar
          items={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={(productId) => setCart((items) => items.filter((item) => item.product.id !== productId))}
          onClearCart={() => setCart([])}
          onOpenCheckout={() => setIsCheckoutOpen(true)}
        />
      </div>

      <POSCheckoutModal
        isOpen={isCheckoutOpen}
        totalAmount={totalAmount}
        onClose={() => setIsCheckoutOpen(false)}
        onConfirmSale={handleConfirmSale}
      />
    </div>
  );
}
