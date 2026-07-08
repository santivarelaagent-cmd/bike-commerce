import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma/client";
import { InventoryService } from "@/services/inventory.service";
import CatalogSortSelect from "@/components/shop/CatalogSortSelect";
import { cn } from "@/utils/cn";

export const revalidate = 10; // short cache for inventory updates

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    brand?: string;
    sort?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const category = params.category || "";
  const brand = params.brand || "";
  const sort = params.sort || "newest";

  // Build Prisma query filters
  const whereClause: any = { isActive: true };

  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category) {
    whereClause.category = { slug: category };
  }

  if (brand) {
    whereClause.brand = { slug: brand };
  }

  let dbProducts: any[] = [];
  let categories: any[] = [];
  let brands: any[] = [];
  let products: any[] = [];

  try {
    // Fetch from DB
    const [fetchedProducts, fetchedCategories, fetchedBrands] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
          brand: true,
          category: true,
          reference: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.category.findMany(),
      prisma.brand.findMany(),
    ]);

    dbProducts = fetchedProducts;
    categories = fetchedCategories;
    brands = fetchedBrands;

    // Fetch live prices and stock from Firebase in parallel on the server
    products = await Promise.all(
      dbProducts.map(async (product) => {
        let price = 0;
        let stock = 0;
        if (product.reference) {
          const inv = await InventoryService.getInventory(product.reference.firebaseKey);
          price = inv.price;
          stock = inv.stock;
        }
        return { ...product, price, stock };
      })
    );
  } catch (error) {
    console.warn("⚠️ Failed to load catalog products or inventory (handled):", error);
  }

  // Apply manual pricing sort since pricing lives in Firebase/Ref layer
  if (sort === "price-asc") {
    products.sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    products.sort((a, b) => b.price - a.price);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="border-b border-border pb-5 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Catálogo de Productos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Encuentra la bicicleta perfecta y los mejores accesorios para tus aventuras.
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-4 lg:gap-x-8">
        {/* Sidebar Filters */}
        <aside className="hidden lg:block space-y-6">
          {/* Categories */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Categorías</h3>
            <div className="flex flex-col space-y-2">
              <Link
                href="/products"
                className={cn(
                  "text-sm hover:text-primary transition-colors",
                  !category ? "text-primary font-bold" : "text-muted-foreground"
                )}
              >
                Todas
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}&brand=${brand}&sort=${sort}`}
                  className={cn(
                    "text-sm hover:text-primary transition-colors",
                    category === cat.slug ? "text-primary font-bold" : "text-muted-foreground"
                  )}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          <hr className="border-border" />

          {/* Brands */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Marcas</h3>
            <div className="flex flex-col space-y-2">
              <Link
                href="/products"
                className={cn(
                  "text-sm hover:text-primary transition-colors",
                  !brand ? "text-primary font-bold" : "text-muted-foreground"
                )}
              >
                Todas
              </Link>
              {brands.map((br) => (
                <Link
                  key={br.id}
                  href={`/products?category=${category}&brand=${br.slug}&sort=${sort}`}
                  className={cn(
                    "text-sm hover:text-primary transition-colors",
                    brand === br.slug ? "text-primary font-bold" : "text-muted-foreground"
                  )}
                >
                  {br.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-3">
          {/* Sort bar & Results count */}
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4 mb-6">
            <p className="text-sm text-muted-foreground">
              Mostrando <span className="font-bold text-foreground">{products.length}</span> resultados
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold">Ordenar por:</span>
              <CatalogSortSelect currentSort={sort} />
            </div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-lg font-semibold text-foreground">No se encontraron productos</h3>
              <p className="text-muted-foreground text-sm mt-1">Prueba modificando los filtros o la búsqueda.</p>
              <Link href="/products" className="mt-4 inline-flex px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                Limpiar filtros
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300"
                >
                  {/* Image */}
                  <div className="aspect-square bg-muted overflow-hidden relative">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {product.stock === 0 && (
                      <span className="absolute top-3 right-3 px-2 py-1 text-[10px] font-bold uppercase rounded bg-destructive text-destructive-foreground">
                        Sin Stock
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        {product.brand.name}
                      </span>
                      <h3 className="font-bold text-base mt-1 text-foreground">
                        <Link href={`/products/${product.slug}`}>
                          <span className="absolute inset-0 z-10" />
                          {product.name}
                        </Link>
                      </h3>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <p className="font-extrabold text-lg text-foreground">
                        ${product.price.toLocaleString("es-AR")}
                      </p>
                      <span className="text-xs text-primary font-bold">Ver Detalles</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
