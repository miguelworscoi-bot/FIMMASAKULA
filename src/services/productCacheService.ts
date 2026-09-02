import { offlineDb, type CachedCategory, type CachedProduct } from "@/lib/db/offlineDb";
import { createClient } from "@/lib/supabase/client";

interface SupabaseProductRow {
  id: string;
  name: string;
  barcode?: string | null;
  price?: number | string | null;
  stock?: number | string | null;
  category_id: string | null;
  updated_at?: string | null;
  categories?: {
    name?: string | null;
    color_hex?: string | null;
  } | null;
}

/** Descarrega categorias e produtos do Supabase para a cache local. */
export async function syncCatalogFromSupabase(): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.onLine) return;

  const supabase = createClient();

  try {
    const { data: categoriesData, error: categoryError } = await supabase
      .from("categories")
      .select("id, name, color_hex");

    if (categoryError) throw categoryError;

    const { data: productsData, error: productError } = await supabase
      .from("products")
      .select(`
        id,
        name,
        barcode,
        price,
        stock,
        category_id,
        updated_at,
        categories ( name, color_hex )
      `);

    if (productError) throw productError;

    const formattedCategories: CachedCategory[] = (categoriesData ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      colorHex: category.color_hex || "#32D583",
    }));

    const formattedProducts: CachedProduct[] = (productsData as SupabaseProductRow[] ?? []).map((product) => ({
      id: product.id,
      name: product.name,
      barcode: product.barcode || "",
      price: Number(product.price) || 0,
      stock: Number(product.stock) || 0,
      categoryId: product.category_id,
      categoryName: product.categories?.name || "Geral",
      categoryColor: product.categories?.color_hex || "#32D583",
      updatedAt: product.updated_at || new Date().toISOString(),
    }));

    await offlineDb.transaction(
      "rw",
      [offlineDb.products, offlineDb.categories],
      async () => {
        await offlineDb.categories.bulkPut(formattedCategories);
        await offlineDb.products.bulkPut(formattedProducts);
      }
    );

    console.log("Cache local de produtos e categorias atualizada!");
  } catch (error) {
    console.error("Erro ao sincronizar catálogo para IndexedDB:", error);
  }
}

/** Abate o stock localmente no IndexedDB durante uma venda offline. */
export async function decrementLocalStock(
  items: Array<{ productId: string; quantity: number }>
): Promise<void> {
  await offlineDb.transaction("rw", offlineDb.products, async () => {
    for (const item of items) {
      const product = await offlineDb.products.get(item.productId);
      if (product) {
        const newStock = Math.max(0, product.stock - Math.max(0, item.quantity));
        await offlineDb.products.update(item.productId, { stock: newStock });
      }
    }
  });
}
