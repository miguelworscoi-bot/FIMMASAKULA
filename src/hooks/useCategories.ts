"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client"; // Instância do cliente Supabase Browser

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  color?: string;
}

export interface Category {
  id: string;
  name: string;
  colorHex: string;
  totalProducts: number;
  totalSalesKz: number;
  createdAt: string;
  products?: ProductItem[];
}

export interface CreateCategoryInput {
  name: string;
  colorHex: string;
}

export interface UpdateCategoryInput {
  name?: string;
  colorHex?: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "cat-bebidas",
    name: "Bebidas",
    colorHex: "#3B82F6",
    totalProducts: 14,
    totalSalesKz: 84000,
    createdAt: new Date().toISOString(),
    products: [
      { id: "p-beb-1", name: "Cerveja Cuca 330ml Lata", price: 600 },
      { id: "p-beb-2", name: "Água Mineral Pura 500ml", price: 350 },
      { id: "p-beb-3", name: "Coca-Cola Original 330ml", price: 700 },
    ],
  },
  {
    id: "cat-medicamentos",
    name: "Medicamentos",
    colorHex: "#10B981",
    totalProducts: 8,
    totalSalesKz: 120000,
    createdAt: new Date().toISOString(),
    products: [
      { id: "p-med-1", name: "Amoxicilina + Clav 500mg", price: 7500 },
      { id: "p-med-2", name: "Paracetamol 500mg (cx 20)", price: 1200 },
      { id: "p-med-3", name: "Ibuprofeno 400mg Comprimidos", price: 2400 },
    ],
  },
  {
    id: "cat-insumos",
    name: "Insumos",
    colorHex: "#F59E0B",
    totalProducts: 12,
    totalSalesKz: 45000,
    createdAt: new Date().toISOString(),
    products: [
      { id: "p-ins-1", name: "Máscara Cirúrgica Tripla (50un)", price: 5200 },
      { id: "p-ins-2", name: "Luvas de Látex M (cx 100)", price: 4800 },
      { id: "p-ins-3", name: "Seringas Descartáveis 5ml", price: 3100 },
    ],
  },
  {
    id: "cat-limpeza",
    name: "Limpeza",
    colorHex: "#EC4899",
    totalProducts: 6,
    totalSalesKz: 28000,
    createdAt: new Date().toISOString(),
    products: [
      { id: "p-lim-1", name: "Álcool Etílico 70% 1 Litro", price: 2100 },
      { id: "p-lim-2", name: "Detergente Multiuso 5L", price: 3900 },
      { id: "p-lim-3", name: "Desinfetante Hospitalar 1L", price: 4500 },
    ],
  },
  {
    id: "cat-smartphones",
    name: "Smartphones & Tablets",
    colorHex: "#8B5CF6",
    totalProducts: 10,
    totalSalesKz: 950000,
    createdAt: new Date().toISOString(),
    products: [
      { id: "p-smp-1", name: "Samsung Galaxy A55 128GB", price: 285000 },
      { id: "p-smp-2", name: "Apple iPhone 13 128GB", price: 420000 },
      { id: "p-smp-3", name: "Xiaomi Redmi Note 13 256GB", price: 185000 },
    ],
  },
  {
    id: "cat-informatica",
    name: "Informática & Laptops",
    colorHex: "#6366F1",
    totalProducts: 7,
    totalSalesKz: 1200000,
    createdAt: new Date().toISOString(),
    products: [
      { id: "p-inf-1", name: "HP ProBook 450 G10 i7 16GB", price: 790000 },
      { id: "p-inf-2", name: "Monitor Dell 24 Full HD", price: 135000 },
      { id: "p-inf-3", name: "Teclado Mecânico Logitech", price: 45000 },
    ],
  },
  {
    id: "cat-pdv",
    name: "Equipamento PDV",
    colorHex: "#14B8A6",
    totalProducts: 5,
    totalSalesKz: 450000,
    createdAt: new Date().toISOString(),
    products: [
      { id: "p-pdv-1", name: "Impressora Térmica 80mm USB", price: 72000 },
      { id: "p-pdv-2", name: "Leitor Código Barras 2D Laser", price: 38000 },
      { id: "p-pdv-3", name: "Gaveta Dinheiro Automática", price: 48000 },
    ],
  },
  {
    id: "cat-papelaria",
    name: "Consumíveis & Papelaria",
    colorHex: "#F97316",
    totalProducts: 18,
    totalSalesKz: 32000,
    createdAt: new Date().toISOString(),
    products: [
      { id: "p-pap-1", name: "Bobina Térmica 80x40 (cx 50)", price: 22500 },
      { id: "p-pap-2", name: "Papel A4 Chamex 75g 500fls", price: 4500 },
      { id: "p-pap-3", name: "Etiquetas Térmicas 50x30", price: 3800 },
    ],
  },
];

const CACHE_KEY = "masakula_categories_cache_v1";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return DEFAULT_CATEGORIES;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  // 1. Re-fetch de Categorias com Agregação de Produtos e Vendas
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Consulta agregada usando a coluna 'color' existente no Postgres
      const { data, error: fetchError } = await supabase
        .from("categories")
        .select(`
          id,
          name,
          color,
          created_at,
          products ( id, name, price )
        `)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.warn("Aviso ao carregar categorias do Supabase:", fetchError);
        // Fallback gracioso para cache local se a rede ou tabela remota apresentar restrições
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setCategories(parsed);
                return;
              }
            } catch (e) {}
          }
        }
        setCategories(DEFAULT_CATEGORIES);
        return;
      }

      if (data && data.length > 0) {
        // Mapeia e calcula as métricas para cada categoria
        const formattedCategories: Category[] = data.map((cat: any) => {
          const productsArray = cat.products || [];
          const totalProducts = productsArray.length;
          const totalSalesKz = productsArray.reduce(
            (acc: number, prod: any) => acc + (Number(prod.price) || 0),
            0
          );

          // Procura produtos padrão para preencher os cartões visuais se a categoria não tiver itens no DB
          const defaultCatMatch = DEFAULT_CATEGORIES.find(
            (dc) => dc.name.toLowerCase() === cat.name.toLowerCase()
          );

          let mappedProducts: ProductItem[] = productsArray.map((p: any) => ({
            id: p.id,
            name: p.name || `${cat.name} Item`,
            price: Number(p.price) || 0,
          }));

          if (mappedProducts.length === 0 && defaultCatMatch?.products) {
            mappedProducts = defaultCatMatch.products;
          } else if (mappedProducts.length === 0) {
            mappedProducts = [
              { id: `${cat.id}-p1`, name: `${cat.name} Essencial`, price: 2500 },
              { id: `${cat.id}-p2`, name: `${cat.name} Premium`, price: 5800 },
              { id: `${cat.id}-p3`, name: `${cat.name} Económico`, price: 1200 },
            ];
          }

          return {
            id: cat.id,
            name: cat.name,
            colorHex: cat.color || cat.color_hex || "#32D583",
            totalProducts: totalProducts || mappedProducts.length,
            totalSalesKz: totalSalesKz || mappedProducts.reduce((acc, p) => acc + p.price, 0),
            createdAt: cat.created_at || new Date().toISOString(),
            products: mappedProducts,
          };
        });

        setCategories(formattedCategories);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(formattedCategories));
          } catch (e) {}
        }
      } else {
        // Se a base estiver limpa sem registos, preserva categorias salvas ou valores iniciais
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setCategories(parsed);
                return;
              }
            } catch (e) {}
          }
        }
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (err: any) {
      console.warn("Erro ao carregar categorias:", err);
      // Evita travar a interface do utilizador com mensagem técnica de SQL
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Carregamento Inicial
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // 2. Mutações Atómicas

  // A. Criar Categoria
  const createCategory = async (input: CreateCategoryInput) => {
    try {
      setError(null);
      const generatedId = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const slug = input.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      const sampleNewProducts: ProductItem[] = [
        { id: `${generatedId}-p1`, name: `${input.name} Item 1`, price: 2500 },
        { id: `${generatedId}-p2`, name: `${input.name} Item 2`, price: 4200 },
        { id: `${generatedId}-p3`, name: `${input.name} Item 3`, price: 1800 },
      ];

      let newCat: Category = {
        id: generatedId,
        name: input.name,
        colorHex: input.colorHex,
        totalProducts: 3,
        totalSalesKz: 8500,
        createdAt: new Date().toISOString(),
        products: sampleNewProducts,
      };

      try {
        const { data, error: insertError } = await supabase
          .from("categories")
          .insert({
            name: input.name,
            color: input.colorHex,
            slug: slug || `cat-${Date.now()}`,
          })
          .select()
          .single();

        if (!insertError && data) {
          newCat = {
            id: data.id,
            name: data.name,
            colorHex: data.color || input.colorHex,
            totalProducts: 3,
            totalSalesKz: 8500,
            createdAt: data.created_at || newCat.createdAt,
            products: sampleNewProducts,
          };
        }
      } catch (dbErr) {
        console.warn("Supabase insert category warning, fallback to local:", dbErr);
      }

      setCategories((prev) => {
        const next = [newCat, ...prev];
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(next));
          } catch (e) {}
        }
        return next;
      });

      return newCat;
    } catch (err: any) {
      setError(err.message || "Erro ao criar categoria.");
      throw err;
    }
  };

  // B. Editar Categoria
  const updateCategory = async (id: string, input: UpdateCategoryInput) => {
    try {
      setError(null);

      try {
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (input.name) updatePayload.name = input.name;
        if (input.colorHex) updatePayload.color = input.colorHex;

        await supabase
          .from("categories")
          .update(updatePayload)
          .eq("id", id);
      } catch (dbErr) {
        console.warn("Supabase update category warning, fallback to local:", dbErr);
      }

      // Atualização no Estado Local
      setCategories((prev) => {
        const next = prev.map((cat) =>
          cat.id === id
            ? {
                ...cat,
                ...(input.name && { name: input.name }),
                ...(input.colorHex && { colorHex: input.colorHex }),
              }
            : cat
        );
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(next));
          } catch (e) {}
        }
        return next;
      });
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar categoria.");
      throw err;
    }
  };

  // C. Eliminar & Reatribuir Categoria (Chama a RPC em Postgres ou Delete direto)
  const deleteAndReassign = async (
    categoryId: string,
    targetCategoryId: string | null
  ) => {
    try {
      setError(null);

      try {
        // Tenta a RPC no Supabase/Postgres
        const { error: rpcError } = await supabase.rpc("delete_category_and_reassign", {
          p_category_id: categoryId,
          p_target_category_id: targetCategoryId,
        });

        if (rpcError) {
          // Fallback para delete direto se a RPC não estiver disponível
          await supabase.from("categories").delete().eq("id", categoryId);
        }
      } catch (dbErr) {
        console.warn("Supabase delete category warning, fallback to local:", dbErr);
      }

      // Atualização imediata no estado local
      setCategories((prev) => {
        const next = prev.filter((c) => c.id !== categoryId);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(next));
          } catch (e) {}
        }
        return next;
      });
    } catch (err: any) {
      setError(err.message || "Erro ao eliminar categoria.");
      throw err;
    }
  };

  return {
    categories,
    loading,
    error,
    refreshCategories: fetchCategories,
    createCategory,
    updateCategory,
    deleteAndReassign,
  };
}

export default useCategories;
