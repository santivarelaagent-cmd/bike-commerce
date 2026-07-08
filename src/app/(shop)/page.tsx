import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, RotateCcw, CreditCard } from "lucide-react";
import { prisma } from "@/lib/prisma/client";
import { InventoryService } from "@/services/inventory.service";

// Enable revalidation or dynamic rendering to show up-to-date prices/stock
export const revalidate = 60; // Revalidate page every 60 seconds

async function getFeaturedProducts() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      take: 4,
      include: {
        brand: true,
        category: true,
        reference: true,
      },
    });

    // Fetch live inventory (stock/price) from Firebase in parallel on the server
    const productsWithInventory = await Promise.all(
      products.map(async (product) => {
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

    return productsWithInventory;
  } catch (error) {
    console.warn("⚠️ Failed to load featured products from database (handled):", error);
    return [];
  }
}

export default async function HomePage() {
  const products = await getFeaturedProducts();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-24 sm:py-32">
        {/* Background GIF with overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/landing-1.gif"
            alt="Hero background"
            className="w-full h-full object-cover opacity-20 select-none pointer-events-none"
          />
          <div className="absolute inset-0 bg-radial from-slate-950/40 via-slate-950/70 to-slate-950 z-10"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.25),transparent_50%)] z-10"></div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-6">
              Nueva Colección 2026
            </span>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-none">
              Descubre tu , <br />
              <span className="text-primary bg-clip-text bg-gradient-to-r from-primary to-orange-400">
                próxima aventura
              </span>
            </h1>
            <p className="text-lg text-muted-foreground mb-10 max-w-lg">
             Los mejores componentes y accesorios para llevar tu pasión por el ciclismo al siguiente nivel
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 h-12 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
              >
                <span>Ver Catálogo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/products?category=electric-bikes"
                className="inline-flex items-center justify-center px-6 h-12 rounded-full border border-border bg-card/20 backdrop-blur-sm text-foreground font-semibold hover:bg-card/45 transition-colors"
              >
                Explorar E-Bikes
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-y border-border bg-card py-8 text-card-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Envíos a Todo el País</h3>
                <p className="text-xs text-muted-foreground">Logística rápida y segura</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Cuotas con Mercado Pago</h3>
                <p className="text-xs text-muted-foreground">Todas las tarjetas de crédito</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Garantía Asegurada</h3>
                <p className="text-xs text-muted-foreground">Cambios gratis por 30 días</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Compra Protegida</h3>
                <p className="text-xs text-muted-foreground">Respaldo oficial de marcas</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-background text-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Productos Destacados</h2>
              <p className="text-muted-foreground text-sm mt-2">
                Selección exclusiva de bicicletas disponibles para entrega inmediata.
              </p>
            </div>
            <Link
              href="/products"
              className="mt-4 sm:mt-0 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              <span>Ver todos los productos</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-xs transition-transform hover:-translate-y-1 hover:shadow-md"
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
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                      {product.brand.name}
                    </span>
                    <h3 className="font-bold text-lg mt-1 text-foreground">
                      <Link href={`/products/${product.slug}`}>
                        <span className="absolute inset-0 z-10" />
                        {product.name}
                      </Link>
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                      {product.description}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-xl font-extrabold text-foreground">
                      ${product.price.toLocaleString("es-AR")}
                    </p>
                    <span className="text-xs text-primary font-bold">Ver Detalles</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20 bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight">Categorías</h2>
            <p className="text-muted-foreground text-sm mt-2">
              Explora nuestra gama de productos segmentada por especialidades.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="relative h-80 rounded-2xl overflow-hidden group shadow-xs">
              <img
                src="https://images.unsplash.com/photo-1576435465679-644487042a13?q=80&w=500&auto=format&fit=crop"
                alt="Mountain"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-xl font-bold">Mountain Bikes</h3>
                <Link
                  href="/products?category=mountain-bikes"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline mt-2"
                >
                  <span>Explorar</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="relative h-80 rounded-2xl overflow-hidden group shadow-xs">
              <img
                src="https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=500&auto=format&fit=crop"
                alt="Road"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-xl font-bold">Road Bikes</h3>
                <Link
                  href="/products?category=road-bikes"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline mt-2"
                >
                  <span>Explorar</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="relative h-80 rounded-2xl overflow-hidden group shadow-xs">
              <img
                src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=500&auto=format&fit=crop"
                alt="Electric"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-xl font-bold">Electric Bikes</h3>
                <Link
                  href="/products?category=electric-bikes"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline mt-2"
                >
                  <span>Explorar</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
