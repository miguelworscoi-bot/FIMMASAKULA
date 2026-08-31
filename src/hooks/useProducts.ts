import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  stock: number;
  image_url: string;
  category: string;
  sales_count: number;
  is_featured: boolean;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("sales_count", { ascending: false });

      if (error) {
        console.error("Erro ao procurar produtos no Supabase:", error);
      } else {
        setProducts(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    // Sincronização em Tempo Real (Realtime)
    const channel = supabase
      .channel("products-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Top 10 Produtos Mais Vendidos para o Carrossel 3D
  const topProducts = products.slice(0, 10);

  return { products, topProducts, loading, refetch: fetchProducts };
}

export default useProducts;
