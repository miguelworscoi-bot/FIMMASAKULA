import React from "react";
import { useCartStore } from "../store/use-cart-store";
import { ProductGrid } from "../components/ProductGrid";

// Dados de simulação
export const MOCK_PRODUCTS = [
  {
    id: "prod-1",
    name: "Sipzy Lemon Drink",
    category: "Bebidas",
    price: 3500,
    imageUrl: "/mock/sipzy-lemon.png", // PNG transparente
  },
  {
    id: "prod-2",
    name: "Sipzy King Can",
    category: "Bebidas",
    price: 4200,
    imageUrl: "/mock/sipzy-black.png", // PNG transparente
  },
  {
    id: "prod-3",
    name: "Água Mineral Cuca 500ml",
    category: "Bebidas",
    price: 500,
  },
];

export function PDVMainView() {
  const { addItem } = useCartStore();

  return (
    <div className="flex h-screen w-full bg-neutral-950 overflow-hidden">
      {/* Esquerda: Grid Dinâmico com Animações */}
      <ProductGrid
        products={MOCK_PRODUCTS}
        onAddToCart={(product) => {
          addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            imageUrl: product.imageUrl,
          });
        }}
      />

      {/* Direita: Carrinho Existente (Intacto) */}
      {/* <CartDrawer /> */}
    </div>
  );
}

export default PDVMainView;
