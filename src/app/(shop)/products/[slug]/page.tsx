import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { InventoryService } from "@/services/inventory.service";
import ProductDetailClient from "@/components/shop/ProductDetailClient";
import { Metadata } from "next";

export const revalidate = 10; // Dynamic cache time

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate dynamic SEO metadata
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
  });

  if (!product) {
    return {
      title: "Producto No Encontrado",
    };
  }

  return {
    title: `${product.name} | Mango Bike`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: `${product.name} | Mango Bike`,
      description: product.description.slice(0, 160),
      images: [{ url: product.images[0] }],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      brand: true,
      category: true,
      reference: true,
    },
  });

  if (!product) {
    notFound();
  }

  // Fetch live inventory (price, stock) from Firebase
  let price = 0;
  let stock = 0;
  let firebaseKey = "";

  if (product.reference) {
    firebaseKey = product.reference.firebaseKey;
    const inv = await InventoryService.getInventory(firebaseKey);
    price = inv.price;
    stock = inv.stock;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="flex text-sm text-muted-foreground mb-8">
        <ol className="flex items-center space-x-2">
          <li>
            <a href="/" className="hover:text-primary transition-colors">
              Inicio
            </a>
          </li>
          <li>/</li>
          <li>
            <a href="/products" className="hover:text-primary transition-colors">
              Catálogo
            </a>
          </li>
          <li>/</li>
          <li className="text-foreground font-semibold truncate max-w-[200px]">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* Interactive detail view */}
      <ProductDetailClient
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          description: product.description,
          images: product.images,
          brand: product.brand,
          category: product.category,
        }}
        price={price}
        stock={stock}
        firebaseKey={firebaseKey}
      />
    </div>
  );
}
