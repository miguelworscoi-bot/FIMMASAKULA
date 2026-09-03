"use client";

import React, { useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { CategoryFolderCard } from "@/components/categories/CategoryFolderCard";
import { CategoryFormModal, CategoryFormData } from "@/components/categories/CategoryFormModal";
import { DeleteCategoryModal } from "@/components/categories/DeleteCategoryModal";
import { AnimatedTrashManager } from "@/components/pdv/AnimatedTrashManager";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTrash } from "@/contexts/TrashContext";
import { InlinePageUndoBanner } from "@/components/ui/InlinePageUndoBanner";

export interface CategoriesSubscreenPageProps {
  onSelectCategoryFilter?: (categoryName: string) => void;
  inventoryProducts?: any[];
}

export default function CategoriesSubscreenPage({
  onSelectCategoryFilter,
  inventoryProducts = [],
}: CategoriesSubscreenPageProps = {}) {
  const {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteAndReassign,
  } = useCategories();

  const { trash } = useTrash();

  // Estados de Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deletingCategory, setDeletingCategory] = useState<any>(null);
  const [isTrashOpen, setIsTrashOpen] = useState(false);

  // Handlers
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (cat) {
      setEditingCategory(cat);
      setIsFormOpen(true);
    }
  };

  const handleOpenDelete = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (cat) {
      setDeletingCategory(cat);
    }
  };

  const handleFormSubmit = async (data: CategoryFormData, id?: string) => {
    if (id) {
      await updateCategory(id, { name: data.name, colorHex: data.colorHex });
    } else {
      await createCategory({ name: data.name, colorHex: data.colorHex });
    }
  };

  const handleConfirmDelete = async (
    categoryId: string,
    targetCategoryId: string | null
  ) => {
    try {
      const cat = deletingCategory;
      const catName = cat?.name || "Categoria";
      await deleteAndReassign(categoryId, targetCategoryId);

      if (cat) {
        trash({
          id: cat.id,
          name: cat.name,
          type: 'category',
          typeLabel: 'Categoria',
          data: { category: cat, targetCategoryId },
          onRestore: async (itemData) => {
            await createCategory({
              name: itemData.category.name,
              colorHex: itemData.category.colorHex,
            });
          },
        });
      }

      toast.success(`Categoria "${catName}" movida para a lixeira.`);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao eliminar categoria.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-emerald-400">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Botão de Criação */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Categorias</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTrashOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white px-4 py-2.5 text-xs font-bold transition cursor-pointer border border-white/10 shadow-sm"
          >
            <Trash2 className="h-4 w-4 text-rose-400" />
            <span>Reciclagem & Arquivo</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-2xl bg-[#32D583] px-4 py-2.5 text-xs font-bold text-black transition hover:bg-[#28c072] cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <Plus className="h-4 w-4" />
            Nova Categoria
          </button>
        </div>
      </div>

      {/* BANNER DE UNDO NA PRÓPRIA PÁGINA (aparece instantaneamente aqui quando se apaga uma categoria) */}
      <InlinePageUndoBanner pageType="category" />

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-400">
          {error}
        </div>
      )}

      {/* Grid de Categorias */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat) => {
          // Filtra do inventário ativo se disponível, caso contrário usa os produtos da categoria
          const inventoryMatches =
            inventoryProducts && inventoryProducts.length > 0
              ? inventoryProducts
                  .filter(
                    (p) =>
                      (p.category || "").toLowerCase() === cat.name.toLowerCase()
                  )
                  .map((p) => ({
                    id: p.id,
                    name: p.name,
                    price: Number(p.salePrice || p.price || 0),
                  }))
              : [];

          const cardProducts =
            inventoryMatches.length > 0
              ? inventoryMatches
              : cat.products && cat.products.length > 0
              ? cat.products
              : [
                  { id: `${cat.id}-p1`, name: `${cat.name} Artigo 1`, price: 1500 },
                  { id: `${cat.id}-p2`, name: `${cat.name} Artigo 2`, price: 3200 },
                  { id: `${cat.id}-p3`, name: `${cat.name} Artigo 3`, price: 4800 },
                ];

          const totalArticles = inventoryMatches.length > 0 ? inventoryMatches.length : cat.totalProducts;
          const totalRevenue =
            inventoryMatches.length > 0
              ? inventoryMatches.reduce((sum, item) => sum + item.price, 0)
              : cat.totalSalesKz;

          return (
            <CategoryFolderCard
              key={cat.id}
              id={cat.id}
              name={cat.name}
              totalProducts={totalArticles}
              totalSalesKz={totalRevenue}
              colorHex={cat.colorHex}
              products={cardProducts}
              onSelectCategory={() => onSelectCategoryFilter?.(cat.name)}
              onEditCategory={handleOpenEdit}
              onDeleteCategory={handleOpenDelete}
            />
          );
        })}
      </div>

      {/* Modal de Formulário (Criar / Editar) */}
      <CategoryFormModal
        isOpen={isFormOpen}
        initialData={editingCategory}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Modal de Eliminação e Reatribuição */}
      <DeleteCategoryModal
        isOpen={!!deletingCategory}
        categoryToDelete={deletingCategory}
        availableCategories={categories}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Modal da Lixeira & Arquivo Animada */}
      {isTrashOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl animate-in zoom-in-95 duration-150">
            <AnimatedTrashManager
              onClose={() => setIsTrashOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export { CategoriesSubscreenPage };
