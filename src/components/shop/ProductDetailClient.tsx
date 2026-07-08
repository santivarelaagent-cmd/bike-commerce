"use client";

import React, { useState } from "react";
import { ShoppingCart, Check, Shield, Truck, RefreshCw } from "lucide-react";
import { useCart } from "@/providers/CartProvider";
import { cn } from "@/utils/cn";

interface ProductDetailClientProps {
  product: {
    id: string;
    slug: string;
    name: string;
    description: string;
    images: string[];
    brand: { name: string };
    category: { name: string };
  };
  price: number;
  stock: number;
  firebaseKey: string;
}

export default function ProductDetailClient({
  product,
  price,
  stock,
  firebaseKey,
}: ProductDetailClientProps) {
  const { addToCart } = useCart();
  const [activeImage, setActiveImage] = useState(product.images[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0],
        price,
        firebaseKey,
      },
      quantity
    );

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const isOutOfStock = stock <= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      {/* Left: Gallery */}
      <div className="space-y-4">
        <div className="aspect-square bg-card rounded-2xl overflow-hidden border border-border">
          <img
            src={activeImage}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-300"
          />
        </div>
        {product.images.length > 1 && (
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                className={cn(
                  "aspect-square rounded-lg overflow-hidden border bg-card transition-all",
                  activeImage === img ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                )}
              >
                <img src={img} alt={`${product.name} gallery ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Info & Actions */}
      <div className="flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <span className="text-sm text-primary uppercase font-extrabold tracking-wider">
              {product.brand.name}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-1">
              {product.name}
            </h1>
            <span className="inline-block mt-3 text-xs font-semibold px-2.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
              {product.category.name}
            </span>
          </div>

          <div className="py-4 border-y border-border">
            <p className="text-3xl font-black text-foreground">
              ${price.toLocaleString("es-AR")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Precios dinámicos sincronizados con el inventario
            </p>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>

        {/* Purchase Controls */}
        <div className="mt-8 pt-8 border-t border-border space-y-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-foreground">Stock:</span>
            {isOutOfStock ? (
              <span className="text-sm font-bold text-destructive">Fuera de Stock</span>
            ) : (
              <span className="text-sm font-semibold text-emerald-500">
                Disponible ({stock} unidades)
              </span>
            )}
          </div>

          {!isOutOfStock && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">Cantidad:</span>
              <div className="flex items-center border border-border rounded-full bg-card overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 hover:bg-muted text-foreground font-bold transition-colors"
                >
                  -
                </button>
                <span className="w-10 h-10 flex items-center justify-center font-bold text-sm text-foreground">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                  className="w-10 h-10 hover:bg-muted text-foreground font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={cn(
                "flex-1 h-12 rounded-full font-semibold flex items-center justify-center gap-2 transition-all",
                isOutOfStock
                  ? "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                  : added
                  ? "bg-emerald-500 text-white"
                  : "bg-primary text-primary-foreground hover:opacity-90 active:scale-98"
              )}
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Añadido!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <span>Añadir al Carrito</span>
                </>
              )}
            </button>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-3 gap-4 text-center text-[10px] text-muted-foreground border-t border-border pt-6">
            <div className="flex flex-col items-center gap-1">
              <Shield className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">Garantía Oficial</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Truck className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">Envío Asegurado</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <RefreshCw className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">Cambio Fácil</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
