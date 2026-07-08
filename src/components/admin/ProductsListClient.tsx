"use client";

import React, { useState } from "react";
import { RefreshCcw, Edit2, PlusCircle, Check, X, Loader2 } from "lucide-react";
import { updateAdminProductInventory } from "@/actions/admin";

interface ProductRow {
  id: string;
  name: string;
  brand: { name: string };
  category: { name: string };
  reference: {
    id: string;
    firebaseKey: string;
    mercadoLibreId: string | null;
    sku: string | null;
  } | null;
  stock: number;
  price: number;
}

interface ProductsListClientProps {
  initialProducts: ProductRow[];
  categories: Array<{ id: string; name: string }>;
  brands: Array<{ id: string; name: string }>;
}

export default function ProductsListClient({ initialProducts }: ProductsListClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState(0);
  const [editPrice, setEditPrice] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStartEdit = (product: ProductRow) => {
    setEditingId(product.id);
    setEditStock(product.stock);
    setEditPrice(product.price);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveInventory = async (product: ProductRow) => {
    if (!product.reference) return;
    setUpdatingId(product.id);

    try {
      const response = await updateAdminProductInventory(
        product.id,
        product.reference.firebaseKey,
        editStock,
        editPrice
      );

      if (response.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, stock: editStock, price: editPrice } : p
          )
        );
        setEditingId(null);
      } else {
        alert(response.error || "Error al actualizar inventario");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Inventario General</h2>
        <div className="text-xs text-muted-foreground font-semibold bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full">
          Firebase Sync Activo
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-muted/30 border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
              <th className="p-4">Producto</th>
              <th className="p-4">SKU / Ref</th>
              <th className="p-4">Firebase Key</th>
              <th className="p-4">ID Meli</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Precio</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {products.map((product) => {
              const isEditing = editingId === product.id;
              const isUpdating = updatingId === product.id;

              return (
                <tr key={product.id} className="hover:bg-muted/10">
                  {/* Name */}
                  <td className="p-4">
                    <p className="font-bold text-foreground text-sm">{product.name}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {product.brand.name} &middot; {product.category.name}
                    </span>
                  </td>

                  {/* SKU */}
                  <td className="p-4 font-mono text-muted-foreground">
                    {product.reference?.sku || "N/A"}
                  </td>

                  {/* Firebase Key */}
                  <td className="p-4 text-muted-foreground font-semibold">
                    {product.reference?.firebaseKey || "No configurada"}
                  </td>

                  {/* ML ID */}
                  <td className="p-4 font-mono text-muted-foreground">
                    {product.reference?.mercadoLibreId || "N/A"}
                  </td>

                  {/* Stock */}
                  <td className="p-4">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editStock}
                        onChange={(e) => setEditStock(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-16 h-8 px-2 rounded border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                      />
                    ) : (
                      <span
                        className={
                          product.stock === 0 ? "font-bold text-destructive" : "font-semibold text-foreground"
                        }
                      >
                        {product.stock} u.
                      </span>
                    )}
                  </td>

                  {/* Price */}
                  <td className="p-4">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editPrice}
                        step="0.01"
                        onChange={(e) => setEditPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-24 h-8 px-2 rounded border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                      />
                    ) : (
                      <span className="font-bold text-foreground">
                        ${product.price.toLocaleString("es-AR")}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right">
                    {isUpdating ? (
                      <div className="inline-flex items-center gap-1.5 text-muted-foreground text-xs">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span>Sincronizando...</span>
                      </div>
                    ) : isEditing ? (
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => handleSaveInventory(product)}
                          className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20"
                          title="Guardar"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20"
                          title="Cancelar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(product)}
                        disabled={!product.reference}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 font-bold transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <RefreshCcw className="w-3 h-3" />
                        <span>Sync</span>
                      </button>
                    )}
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
