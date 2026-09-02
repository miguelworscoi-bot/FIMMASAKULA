import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../../lib/supabase";
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Check, 
  X, 
  Loader2, 
  Boxes, 
  Barcode, 
  RefreshCw,
  Tag
} from "lucide-react";
import { formatKz } from "../../utils/formatters";

export interface Category {
  id: string;
  name: string;
}

export interface ProductItem {
  id: string;
  name: string;
  barcode: string | null;
  category_id: string | null;
  category?: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  min_stock: number;
  active: boolean;
  categories?: { name: string } | null;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-01", name: "Bebidas & Refrigerantes" },
  { id: "cat-02", name: "Alimentação & Mercearia" },
  { id: "cat-03", name: "Higiene & Limpeza" },
  { id: "cat-04", name: "Lanches & Snacks" },
  { id: "cat-05", name: "Padaria & Pastelaria" },
];

const DEFAULT_PRODUCTS: ProductItem[] = [
  {
    id: "prod-01",
    name: "Coca-Cola Original 330ml",
    barcode: "5449000000996",
    category_id: "cat-01",
    price: 650,
    cost_price: 420,
    stock_quantity: 48,
    min_stock: 12,
    active: true,
    categories: { name: "Bebidas & Refrigerantes" }
  },
  {
    id: "prod-02",
    name: "Água Mineral Cuca 500ml",
    barcode: "5601234001021",
    category_id: "cat-01",
    price: 300,
    cost_price: 150,
    stock_quantity: 120,
    min_stock: 24,
    active: true,
    categories: { name: "Bebidas & Refrigerantes" }
  },
  {
    id: "prod-03",
    name: "Arroz Branco Tio Lucas 1kg",
    barcode: "5601234002035",
    category_id: "cat-02",
    price: 1850,
    cost_price: 1350,
    stock_quantity: 6,
    min_stock: 15,
    active: true,
    categories: { name: "Alimentação & Mercearia" }
  },
  {
    id: "prod-04",
    name: "Óleo Alimentar Fula 1L",
    barcode: "5601234003049",
    category_id: "cat-02",
    price: 2400,
    cost_price: 1900,
    stock_quantity: 4,
    min_stock: 10,
    active: true,
    categories: { name: "Alimentação & Mercearia" }
  },
  {
    id: "prod-05",
    name: "Pão Francês Fresco (Unidade)",
    barcode: null,
    category_id: "cat-05",
    price: 150,
    cost_price: 70,
    stock_quantity: 85,
    min_stock: 20,
    active: true,
    categories: { name: "Padaria & Pastelaria" }
  }
];

export function ProductsManagementPage() {
  const [products, setProducts] = useState<ProductItem[]>(() => {
    try {
      const saved = localStorage.getItem("masakula_admin_products_v1");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Storage parse error:", e);
    }
    return DEFAULT_PRODUCTS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem("masakula_admin_categories_v1");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Storage parse error:", e);
    }
    return DEFAULT_CATEGORIES;
  });

  const [loading, setLoading] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [minStock, setMinStock] = useState("5");
  const [formLoading, setFormLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Persist Local Cache
  useEffect(() => {
    try {
      localStorage.setItem("masakula_admin_products_v1", JSON.stringify(products));
      localStorage.setItem("masakula_admin_categories_v1", JSON.stringify(categories));
    } catch (e) {
      console.warn("Storage write error:", e);
    }
  }, [products, categories]);

  // Carregar Dados do Supabase
  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        supabase
          .from("products")
          .select("*, categories(name)")
          .order("created_at", { ascending: false }),
        supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true })
      ]);

      if (!prodRes.error && prodRes.data && prodRes.data.length > 0) {
        setProducts(prodRes.data as ProductItem[]);
      }
      if (!catRes.error && catRes.data && catRes.data.length > 0) {
        setCategories(catRes.data as Category[]);
      }
    } catch (err) {
      console.warn("Supabase fetch notice:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Abrir Modal de Criação / Edição
  const handleOpenModal = (product?: ProductItem) => {
    setFeedbackMsg(null);
    if (product) {
      setEditingProduct(product);
      setName(product.name);
      setBarcode(product.barcode || "");
      setCategoryId(product.category_id || "");
      setPrice(product.price.toString());
      setCostPrice(product.cost_price.toString());
      setStockQuantity(product.stock_quantity.toString());
      setMinStock(product.min_stock.toString());
    } else {
      setEditingProduct(null);
      setName("");
      setBarcode("");
      setCategoryId(categories[0]?.id || "");
      setPrice("");
      setCostPrice("");
      setStockQuantity("0");
      setMinStock("5");
    }
    setIsModalOpen(true);
  };

  // Submeter Formulário (Criar / Editar)
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    const priceNum = parseFloat(price) || 0;
    const costNum = parseFloat(costPrice) || 0;
    const stockNum = parseInt(stockQuantity, 10) || 0;
    const minStockNum = parseInt(minStock, 10) || 0;
    const cleanBarcode = barcode.trim() === "" ? null : barcode.trim();
    const targetCategory = categories.find((c) => c.id === categoryId);

    const payload = {
      name: name.trim(),
      barcode: cleanBarcode,
      category_id: categoryId || null,
      price: priceNum,
      cost_price: costNum,
      stock_quantity: stockNum,
      min_stock: minStockNum,
      updated_at: new Date().toISOString()
    };

    try {
      if (editingProduct) {
        await supabase
          .from("products")
          .update(payload)
          .eq("id", editingProduct.id);

        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id
              ? {
                  ...p,
                  ...payload,
                  categories: targetCategory ? { name: targetCategory.name } : null
                }
              : p
          )
        );
      } else {
        const newId = `prod-${Date.now()}`;
        const newProductObj: ProductItem = {
          id: newId,
          ...payload,
          active: true,
          categories: targetCategory ? { name: targetCategory.name } : null
        };

        try {
          await supabase.from("products").insert({ ...payload, active: true });
        } catch (err) {
          console.warn("Supabase insert notice:", err);
        }

        setProducts((prev) => [newProductObj, ...prev]);
      }

      setFeedbackMsg({
        type: "success",
        text: `Produto ${editingProduct ? "atualizado" : "cadastrado"} com sucesso!`
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFeedbackMsg({
        type: "error",
        text: "Erro ao salvar produto: " + (err?.message || "Tente novamente")
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Alternar Status de Ativo / Inativo
  const handleToggleActive = async (product: ProductItem) => {
    try {
      await supabase
        .from("products")
        .update({ active: !product.active })
        .eq("id", product.id);
    } catch (err) {
      console.warn("Toggle active notice:", err);
    }

    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p))
    );
  };

  // Apagar Produto
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja remover este produto do catálogo?")) return;

    try {
      await supabase.from("products").delete().eq("id", id);
    } catch (err) {
      console.warn("Delete notice:", err);
    }

    setProducts((prev) => prev.filter((p) => p.id !== id));
    setFeedbackMsg({ type: "success", text: "Produto removido com sucesso!" });
  };

  // Filtragem Dinâmica de Produtos
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm));
      
      const matchesCategory = selectedCategory === "all" || p.category_id === selectedCategory;
      const matchesLowStock = !showLowStockOnly || p.stock_quantity <= p.min_stock;

      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [products, searchTerm, selectedCategory, showLowStockOnly]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 sm:p-10 select-none">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Boxes className="w-8 h-8 text-indigo-500" />
            Catálogo & Gestão de Inventário
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Controle de stocks, preços de venda, margens de custo e alerta de reposição.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="py-3 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-indigo-600/20 border border-indigo-400/30 transition flex items-center gap-2 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Produto</span>
        </button>
      </div>

      {/* BARRA DE FILTROS & PESQUISA */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Pesquisa por Texto/Código */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Nome ou Código de Barras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Categoria */}
        <div className="relative">
          <Tag className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500 transition cursor-pointer"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Filtro de Stock Baixo */}
        <button
          type="button"
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer ${
            showLowStockOnly
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
              : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Apenas Stock Crítico</span>
        </button>

        {/* Atualizar */}
        <button
          type="button"
          onClick={fetchData}
          className="py-2.5 px-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition flex items-center justify-center gap-2 text-xs font-bold cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Recarregar</span>
        </button>
      </div>

      {/* FEEDBACK */}
      {feedbackMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
            feedbackMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button type="button" onClick={() => setFeedbackMsg(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* TABELA DE PRODUTOS */}
      <div className="bg-neutral-900 border border-neutral-800/80 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 uppercase tracking-wider font-extrabold text-[11px]">
              <tr>
                <th className="py-4 px-6">Produto</th>
                <th className="py-4 px-6">Categoria</th>
                <th className="py-4 px-6">Preço Venda</th>
                <th className="py-4 px-6">Preço Custo</th>
                <th className="py-4 px-6">Stock Atual</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    A carregar inventário...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLowStock = p.stock_quantity <= p.min_stock;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-800/40 transition">
                      <td className="py-4 px-6 font-bold text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 font-black">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="block">{p.name}</span>
                            {p.barcode && (
                              <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-1">
                                <Barcode className="w-3 h-3" /> {p.barcode}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-neutral-400 font-medium">
                        {p.categories?.name || "Sem Categoria"}
                      </td>

                      <td className="py-4 px-6 font-black text-emerald-400">
                        {formatKz(p.price)}
                      </td>

                      <td className="py-4 px-6 font-bold text-neutral-400">
                        {formatKz(p.cost_price)}
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`font-black font-mono px-2.5 py-1 rounded-lg border ${
                            isLowStock 
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse" 
                              : "bg-neutral-950 border-neutral-800 text-neutral-200"
                          }`}>
                            {p.stock_quantity} un
                          </span>
                          {isLowStock && (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border transition cursor-pointer ${
                            p.active
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-neutral-800 border-neutral-700 text-neutral-500"
                          }`}
                        >
                          {p.active ? "Ativo" : "Inativo"}
                        </button>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(p)}
                            className="p-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white rounded-xl transition cursor-pointer"
                            title="Editar Produto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 bg-neutral-800 hover:bg-red-500/20 border border-neutral-700 text-neutral-300 hover:text-red-400 rounded-xl transition cursor-pointer"
                            title="Remover Produto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CRIAR / EDITAR PRODUTO */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative my-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-500" />
                  {editingProduct ? "Editar Produto" : "Novo Produto"}
                </h3>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-neutral-500 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitProduct} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-400 block mb-1">Nome do Produto</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Coca-Cola 330ml"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-400 block mb-1">Código de Barras</label>
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="560123456789"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-400 block mb-1">Categoria</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="">Sem Categoria</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-400 block mb-1">Preço de Venda (Kz)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="500.00"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-emerald-400 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-400 block mb-1">Preço de Custo (Kz)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      placeholder="350.00"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-300 font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-400 block mb-1">Stock Inicial</label>
                    <input
                      type="number"
                      required
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      placeholder="50"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-400 block mb-1">Stock Mínimo (Alerta)</label>
                    <input
                      type="number"
                      required
                      value={minStock}
                      onChange={(e) => setMinStock(e.target.value)}
                      placeholder="5"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 mt-4 cursor-pointer"
                >
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editingProduct ? "Guardar Alterações" : "Salvar Produto"}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default ProductsManagementPage;
