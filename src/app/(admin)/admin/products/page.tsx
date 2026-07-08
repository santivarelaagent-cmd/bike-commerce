import React from "react";
import { prisma } from "@/lib/prisma/client";
import { InventoryService } from "@/services/inventory.service";
import ProductsListClient from "@/components/admin/ProductsListClient";
import Link from "next/link";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [dbProducts, categories, brands] = await Promise.all([
    prisma.product.findMany({
      include: {
        brand: true,
        category: true,
        reference: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany(),
    prisma.brand.findMany(),
  ]);

  // Retrieve Firebase inventory details for initial hydration in parallel
  const initialProducts = await Promise.all(
    dbProducts.map(async (product) => {
      let price = 0;
      let stock = 0;

      if (product.reference) {
        const inv = await InventoryService.getInventory(product.reference.firebaseKey);
        price = inv.price;
        stock = inv.stock;
      }

      return {
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        reference: product.reference
          ? {
              id: product.reference.id,
              firebaseKey: product.reference.firebaseKey,
              mercadoLibreId: product.reference.mercadoLibreId,
              sku: product.reference.sku,
            }
          : null,
        stock,
        price,
      };
    })
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Productos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra el catálogo de la tienda y vincula integraciones de inventario.
          </p>
        </div>
      </div>

      {/* Table Client component */}
      <ProductsListClient
        initialProducts={initialProducts}
        categories={categories}
        brands={brands}
      />
    </div>
  );
}
