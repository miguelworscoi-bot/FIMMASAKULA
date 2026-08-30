"use client";

import React, { useState } from "react";
import { BoxIcon, BoxesIcon, DeleteIcon, CogIcon } from "@/components/icons";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductFormModal, ProductFormData } from "@/components/ProductFormModal";

// Mock para pré-visualização da interface
const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "Caixa de Cerveja Cuca 33cl (24 Unidades)",
    sku: "BEV-CUC-001",
    barcode: "5601234567890",
    category: "Bebidas",
    cost_price: 12000,
    selling_price: 16500,
    current_stock: 45,
    min_stock: 10,
    tax_rate: "NOR_14",
    is_active: true,
  },
  {
    id: "2",
    name: "Saco de Arroz 25kg (Pássaro)",
    sku: "GRO-ARR-025",
    barcode: "5609876543210",
    category: "Mercearia",
    cost_price: 28000,
    selling_price: 34000,
    current_stock: 4, // Alerta estoque baixo
    min_stock: 8,
    tax_rate: "NOR_14",
    is_active: true,
  },
  {
    id: "3",
    name: "Óleo Vegetal Victor 1L",
    sku: "GRO-OLE-001",
    barcode: "5605554443331",
    category: "Mercearia",
    cost_price: 1800,
    selling_price: 2300,
    current_stock: 82,
    min_stock: 15,
    tax_rate: "NOR_14",
    is_active: true,
  },
];

export default function ProductsPage() {
  const [productsList, setProductsList] = useState(MOCK_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredProducts = productsList.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStock = filterLowStock ? product.current_stock <= product.min_stock : true;
    return matchesSearch && matchesStock;
  });

  const handleSaveNewProduct = (formData: ProductFormData) => {
    const newProduct = {
      id: String(Date.now()),
      name: formData.name,
      sku: `MSK-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: `560${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      category: formData.category || "Geral",
      cost_price: formData.price * 0.7,
      selling_price: formData.price,
      current_stock: 0,
      min_stock: 5,
      tax_rate: "NOR_14",
      is_active: true,
    };
    setProductsList([newProduct, ...productsList]);
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#131313] text-white min-h-screen">
      {/* Cabeçalho do Módulo */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E1FB15]/10 text-[#E1FB15]">
            <BoxIcon size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Gestão de Produtos</h1>
            <p className="text-xs text-neutral-400">
              Catálogo de artigos, preços de venda e controlo de estoque
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#E1FB15] px-4 py-2.5 text-xs font-bold text-black shadow-lg shadow-[#E1FB15]/20 hover:bg-[#d6f00f] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Novo Produto</span>
        </button>
      </div>

      {isModalOpen && (
        <ProductFormModal
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveNewProduct}
        />
      )}

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400">Total de Produtos</span>
            <p className="text-xl font-bold text-white mt-1">1,248</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300">
            <BoxIcon size={18} />
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400">Estoque Crítico</span>
            <p className="text-xl font-bold text-rose-400 mt-1">12 Artigos</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
            <BoxesIcon size={18} />
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400">Valor do Inventário</span>
            <p className="text-xl font-bold text-[#32D583] mt-1">8,450,000.00 Kz</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-[#32D583]/10 flex items-center justify-center text-[#32D583]">
            <CogIcon size={18} />
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-900/40 p-3 rounded-xl border border-neutral-800">
        <input
          type="text"
          placeholder="Buscar por nome, SKU ou código de barras..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-80 rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#E1FB15]"
        />

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-semibold border transition-all cursor-pointer",
              filterLowStock
                ? "bg-rose-500/10 border-rose-500 text-rose-400"
                : "border-neutral-800 text-neutral-400 hover:border-neutral-700"
            )}
          >
            Apenas Estoque Baixo
          </button>
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
        <table className="w-full text-left text-xs text-neutral-300">
          <thead className="bg-neutral-900 text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-800">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Preço Custo</th>
              <th className="px-4 py-3">Preço Venda</th>
              <th className="px-4 py-3">Estoque</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {filteredProducts.map((product) => {
              const isLowStock = product.current_stock <= product.min_stock;

              return (
                <tr key={product.id} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{product.name}</span>
                      <span className="text-[10px] text-neutral-500">{product.sku}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-300">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">{product.cost_price.toLocaleString()} Kz</td>
                  <td className="px-4 py-3 font-semibold text-white">
                    {product.selling_price.toLocaleString()} Kz
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                        isLowStock
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-[#32D583]/10 text-[#32D583] border border-[#32D583]/20"
                      )}
                    >
                      {product.current_stock} Unid.
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer" title="Configurar">
                        <CogIcon size={16} />
                      </button>
                      <button className="p-1 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer" title="Eliminar">
                        <DeleteIcon size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { ProductsPage };
