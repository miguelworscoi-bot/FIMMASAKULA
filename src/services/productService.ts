import { supabase } from "../lib/supabase";
import type { 
  Product, 
  CreateProductDTO, 
  ProductFilterParams,
  MovementType 
} from "../types/inventory";

export const productService = {
  /**
   * Buscar produtos com suporte a busca, filtros de estoque baixo e paginação
   */
  async getProducts(params: ProductFilterParams = {}) {
    const { search, categoryId, lowStockOnly, page = 1, limit = 20 } = params;

    let query = supabase
      .from("products")
      .select("*, category:categories(id, name, color), supplier:suppliers(id, name)", { count: "exact" })
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`);
    }

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    if (lowStockOnly) {
      query = query.filter("current_stock", "lte", "min_stock");
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return {
      products: (data || []) as Product[],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },

  /**
   * Buscar detalhes completos de um produto por ID
   */
  async getProductById(id: string): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(*), supplier:suppliers(*), batches:product_batches(*)")
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);
    return data as Product;
  },

  /**
   * Cadastrar novo produto
   */
  async createProduct(organizationId: string, dto: CreateProductDTO): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .insert([{ ...dto, organization_id: organizationId }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Product;
  },

  /**
   * Atualizar dados do produto
   */
  async updateProduct(id: string, dto: Partial<CreateProductDTO>): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .update(dto)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Product;
  },

  /**
   * Desativar produto (Soft Delete)
   */
  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  /**
   * Registrar movimentação manual de estoque (Entrada/Ajuste/Quebra)
   */
  async recordStockMovement(params: {
    organizationId: string;
    productId: string;
    batchId?: string;
    type: MovementType;
    quantityChange: number;
    notes?: string;
    userId?: string;
  }) {
    // 1. Obter estoque atual
    const product = await this.getProductById(params.productId);
    const previousStock = product.current_stock;
    const newStock = previousStock + params.quantityChange;

    if (newStock < 0) {
      throw new Error("Estoque insuficiente para esta operação.");
    }

    // 2. Inserir histórico (O Trigger SQL atualizará o saldo em 'products')
    const { data, error } = await supabase
      .from("stock_movements")
      .insert([
        {
          organization_id: params.organizationId,
          product_id: params.productId,
          batch_id: params.batchId,
          type: params.type,
          quantity: Math.abs(params.quantityChange),
          previous_stock: previousStock,
          new_stock: newStock,
          notes: params.notes,
          created_by: params.userId,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};

export default productService;
