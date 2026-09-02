"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FolderTree,
  TrendingUp,
  Award,
  BarChart3,
  Search,
  Plus,
  Layers,
  Sparkles,
  Filter,
  CheckCircle2,
  X,
  Package,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { CategoryFolderCard, ProductItem } from "./CategoryFolderCard";

export interface CategoryData {
  id: string;
  name: string;
  totalProducts: number;
  totalSalesKz: number;
  colorHex: string;
  products: ProductItem[];
}

// Mock Data para Categorias com Produtos para a Animação
export const INITIAL_MOCK_CATEGORIES: CategoryData[] = [
  {
    id: "cat-1",
    name: "Bebidas & Sumos",
    totalProducts: 42,
    totalSalesKz: 1850000,
    colorHex: "#10b981", // Emerald
    products: [
      { id: "p1", name: "Sumo Compal 1L", price: 1200 },
      { id: "p2", name: "Água Chela 1.5L", price: 350 },
      { id: "p3", name: "Cerveja Cuca 33cl", price: 500 },
    ],
  },
  {
    id: "cat-2",
    name: "Mercearia & Secos",
    totalProducts: 88,
    totalSalesKz: 3200000,
    colorHex: "#eab308", // Amber
    products: [
      { id: "p4", name: "Arroz Tio Lucas 5kg", price: 6500 },
      { id: "p5", name: "Óleo Fula 1L", price: 2100 },
      { id: "p6", name: "Massa Espagui", price: 800 },
    ],
  },
  {
    id: "cat-3",
    name: "Higiene & Limpeza",
    totalProducts: 29,
    totalSalesKz: 940000,
    colorHex: "#06b6d4", // Cyan
    products: [
      { id: "p7", name: "Detergente Omo 1kg", price: 3200 },
      { id: "p8", name: "Sabonete Lux", price: 600 },
      { id: "p9", name: "Lixívia Neve 2L", price: 1500 },
    ],
  },
  {
    id: "cat-4",
    name: "Talho & Congelados",
    totalProducts: 35,
    totalSalesKz: 2750000,
    colorHex: "#f43f5e", // Rose
    products: [
      { id: "p10", name: "Frango Cofril 1kg", price: 2800 },
      { id: "p11", name: "Lombo de Porco", price: 5400 },
      { id: "p12", name: "Peixe Carapau", price: 3900 },
    ],
  },
];

const AVAILABLE_COLORS = [
  "#10b981", // Emerald
  "#eab308", // Amber
  "#06b6d4", // Cyan
  "#f43f5e", // Rose
  "#8b5cf6", // Purple
  "#3b82f6", // Blue
  "#f97316", // Orange
  "#6366f1", // Indigo
];

interface CategoriesSubscreenPageProps {
  onSelectCategoryFilter?: (categoryName: string) => void;
}

export function CategoriesSubscreenPage({ onSelectCategoryFilter }: CategoriesSubscreenPageProps) {
  const [categories, setCategories] = useState<CategoryData[]>(INITIAL_MOCK_CATEGORIES);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategoryModal, setActiveCategoryModal] = useState<CategoryData | null>(null);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [selectedEditCategory, setSelectedEditCategory] = useState<string | null>(null);
  const [selectedDeleteCategory, setSelectedDeleteCategory] = useState<string | null>(null);

  // New Category Form State
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#3b82f6");

  // Edit Category Form State
  const [editCatName, setEditCatName] = useState("");
  const [editCatColor, setEditCatColor] = useState("#3b82f6");

  // Animação cíclica autônoma das barras do gráfico
  const [highlightBarIndex, setHighlightBarIndex] = useState<number>(0);

  const topCategory = useMemo(() => {
    if (categories.length === 0) {
      return { id: "", name: "Nenhuma", totalProducts: 0, totalSalesKz: 0, colorHex: "#9ca3af", products: [] };
    }
    return categories.reduce((prev, current) =>
      prev.totalSalesKz > current.totalSalesKz ? prev : current
    );
  }, [categories]);

  const totalCatalogProducts = useMemo(() => {
    return categories.reduce((sum, c) => sum + c.totalProducts, 0);
  }, [categories]);

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const performanceData = useMemo(() => {
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      sales: c.totalSalesKz,
      color: c.colorHex,
      productsCount: c.totalProducts,
    }));
  }, [categories]);

  // Efeito para animação contínua e autônoma do gráfico
  useEffect(() => {
    if (performanceData.length === 0) return;
    const interval = setInterval(() => {
      setHighlightBarIndex((prev) => (prev + 1) % performanceData.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [performanceData.length]);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCategory: CategoryData = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      totalProducts: 0,
      totalSalesKz: 0,
      colorHex: newCatColor,
      products: [],
    };

    setCategories((prev) => [...prev, newCategory]);
    setNewCatName("");
    setIsNewCategoryModalOpen(false);
  };

  // Função de Edição
  const handleEdit = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    console.log("Editar categoria:", cat);
    setSelectedEditCategory(id);
    setEditCatName(cat.name);
    setEditCatColor(cat.colorHex);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditCategory || !editCatName.trim()) return;

    setCategories((prev) =>
      prev.map((c) =>
        c.id === selectedEditCategory
          ? { ...c, name: editCatName.trim(), colorHex: editCatColor }
          : c
      )
    );
    setSelectedEditCategory(null);
  };

  // Função de Eliminação com Cascata/Validação
  const handleDelete = (id: string) => {
    setSelectedDeleteCategory(id);
  };

  const confirmDelete = () => {
    if (!selectedDeleteCategory) return;
    setCategories((prev) => prev.filter((c) => c.id !== selectedDeleteCategory));
    setSelectedDeleteCategory(null);
  };

  return (
    <div className="min-h-screen space-y-8 bg-white text-zinc-900 p-6 md:p-8">
      {/* 1. CABEÇALHO E AÇÕES */}
      <motion.div 
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-zinc-950">
              Gestão de Categorias
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {categories.length} Categorias Ativas
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Organização do catálogo de produtos, pastas interativas e análise de rotação de vendas em Kwanzas (Kz)
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Pesquisar categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 rounded-xl border border-gray-200 bg-zinc-50 pl-9 pr-4 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button 
            onClick={() => setIsNewCategoryModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            Nova Categoria
          </button>
        </div>
      </motion.div>

      {/* 2. CARDS DE RESUMO / KPIS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Card 1: Total de Categorias */}
        <motion.div 
          whileHover={{ y: -2 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-xs hover:shadow-md transition-all"
        >
          <div>
            <p className="text-xs font-bold text-zinc-500">Total de Categorias</p>
            <p className="mt-1 text-2xl font-black text-zinc-950 font-mono">
              {categories.length}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {totalCatalogProducts} produtos associados
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <FolderTree className="h-6 w-6" />
          </div>
        </motion.div>

        {/* Card 2: Categoria Que Mais Vende */}
        <motion.div 
          whileHover={{ y: -2 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-xs hover:shadow-md transition-all"
        >
          <div>
            <p className="text-xs font-bold text-zinc-500">Mais Vendida (Top Volume)</p>
            <p className="mt-1 text-xl font-black text-amber-600 truncate max-w-[180px]">
              {topCategory.name}
            </p>
            <p className="mt-1 text-[11px] font-mono font-medium text-zinc-500">
              {topCategory.totalSalesKz.toLocaleString("pt-AO")} Kz este mês
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
            <Award className="h-6 w-6" />
          </div>
        </motion.div>

        {/* Card 3: Média de Faturação por Categoria */}
        <motion.div 
          whileHover={{ y: -2 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-xs hover:shadow-md transition-all"
        >
          <div>
            <p className="text-xs font-bold text-zinc-500">Média por Categoria</p>
            <p className="mt-1 text-2xl font-black text-zinc-950 font-mono">
              {(
                categories.reduce((a, b) => a + b.totalSalesKz, 0) /
                (categories.length || 1)
              ).toLocaleString("pt-AO", { maximumFractionDigits: 0 })}{" "}
              <span className="text-xs font-medium text-zinc-500">Kz</span>
            </p>
            <p className="mt-1 text-[11px] font-semibold text-emerald-600">+14% vs mês anterior</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 border border-cyan-100">
            <TrendingUp className="h-6 w-6" />
          </div>
        </motion.div>
      </div>

      {/* 3. GRELHA DE PASTAS ANIMADAS 3D COM AÇÕES DE EDITAR/ELIMINAR */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-zinc-900">
              Pastas de Produtos por Tipo
            </h2>
            <span className="text-xs text-zinc-400 font-normal">
              (Passe o cursor sobre a pasta para ver os produtos e opções de gestão)
            </span>
          </div>
          <span className="text-xs text-zinc-500 font-medium">
            Apresentando {filteredCategories.length} de {categories.length}
          </span>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-gray-200 rounded-3xl bg-zinc-50">
            <FolderTree className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-zinc-800">Nenhuma categoria encontrada</p>
            <p className="text-xs text-zinc-500 mt-1">Tente pesquisar por outro termo ou adicione uma nova categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredCategories.map((cat) => (
              <CategoryFolderCard
                key={cat.id}
                id={cat.id}
                name={cat.name}
                totalProducts={cat.totalProducts}
                totalSalesKz={cat.totalSalesKz}
                colorHex={cat.colorHex}
                products={cat.products}
                onEditCategory={handleEdit}
                onDeleteCategory={handleDelete}
                onSelectCategory={(id) => {
                  console.log("Navegar para categoria", id);
                  const found = categories.find((c) => c.id === id);
                  if (found) setActiveCategoryModal(found);
                  if (onSelectCategoryFilter) onSelectCategoryFilter(cat.name);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 4. GRÁFICOS INTERATIVOS DE DESEMPENHO E COMPARAÇÃO */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Gráfico 1: Comparação de Vendas por Categoria com Auto-Animação */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs hover:shadow-md transition-shadow lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900">
                  Comparativo de Faturação por Categoria
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Animação Contínua
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Volume acumulado de vendas diretas no PDV em Kwanzas
              </p>
            </div>
            <BarChart3 className="h-5 w-5 text-zinc-400" />
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#9ca3af" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: "#e5e7eb" }}
                  interval={0}
                  angle={-10}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0, 0, 0, 0.03)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-gray-200 bg-white p-3 text-xs shadow-xl ring-1 ring-black/5">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <p className="font-bold text-zinc-900">{item.name}</p>
                          </div>
                          <p className="mt-1 font-black text-emerald-600 text-sm font-mono">
                            {item.sales.toLocaleString("pt-AO")} Kz
                          </p>
                          <p className="text-zinc-500 mt-0.5">Produtos: <span className="font-semibold text-zinc-800">{item.productsCount}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="sales" 
                  radius={[8, 8, 2, 2]}
                  isAnimationActive={true}
                  animationDuration={1400}
                >
                  {performanceData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      stroke={index === highlightBarIndex ? "#18181b" : "transparent"}
                      strokeWidth={index === highlightBarIndex ? 2 : 0}
                      className="transition-all duration-300"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gráfico 2: Rotação de Stock por Categoria */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xs hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Participação de Catálogo</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Distribuição de itens por pasta</p>
            </div>
            <Layers className="w-4 h-4 text-zinc-400" />
          </div>

          <div className="space-y-4">
            {categories.map((cat) => {
              const percentage = totalCatalogProducts > 0 
                ? Math.round((cat.totalProducts / totalCatalogProducts) * 100)
                : 0;
              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-zinc-800">{cat.name}</span>
                    <span className="text-zinc-500 font-mono font-medium">
                      {cat.totalProducts} un ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: cat.colorHex,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* MODAL DETALHE DA CATEGORIA */}
      <AnimatePresence>
        {activeCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: activeCategoryModal.colorHex }} />
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">{activeCategoryModal.name}</h3>
                    <p className="text-xs text-zinc-500">{activeCategoryModal.totalProducts} produtos cadastrados</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveCategoryModal(null)}
                  className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Produtos em Destaque</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activeCategoryModal.products.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-3 text-center">Nenhum produto associado a esta categoria.</p>
                  ) : (
                    activeCategoryModal.products.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-zinc-400" />
                          <span className="text-xs font-bold text-zinc-800">{p.name}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-600">
                          {p.price.toLocaleString("pt-AO")} Kz
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCategoryModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CRIAR NOVA CATEGORIA */}
      <AnimatePresence>
        {isNewCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-zinc-900">Nova Categoria</h3>
                </div>
                <button 
                  onClick={() => setIsNewCategoryModalOpen(false)}
                  className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Nome da Categoria</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Padaria & Pastelaria"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-zinc-50 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Cor da Pasta</label>
                  <div className="flex items-center gap-2">
                    {AVAILABLE_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCatColor(color)}
                        className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                          newCatColor === color ? "scale-125 ring-2 ring-zinc-900 ring-offset-2" : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsNewCategoryModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
                  >
                    Criar Categoria
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL EDITAR CATEGORIA */}
      <AnimatePresence>
        {selectedEditCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-cyan-600" />
                  <h3 className="text-base font-bold text-zinc-900">Editar Categoria</h3>
                </div>
                <button 
                  onClick={() => setSelectedEditCategory(null)}
                  className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Nome da Categoria</label>
                  <input
                    type="text"
                    required
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-zinc-50 focus:bg-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Cor da Pasta</label>
                  <div className="flex items-center gap-2">
                    {AVAILABLE_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditCatColor(color)}
                        className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                          editCatColor === color ? "scale-125 ring-2 ring-zinc-900 ring-offset-2" : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setSelectedEditCategory(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-700 shadow-xs cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONFIRMAÇÃO DE ELIMINAÇÃO */}
      <AnimatePresence>
        {selectedDeleteCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-[#131313] p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-lg font-bold text-white">Eliminar Categoria</h3>
              <p className="mt-2 text-xs text-gray-400">
                Tem a certeza que deseja remover esta categoria? Os produtos associados ficarão sem categoria atribuída no Supabase.
              </p>
              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDeleteCategory(null)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-white/10 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-600 cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CategoriesSubscreenPage;
