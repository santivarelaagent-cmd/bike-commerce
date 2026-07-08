"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface CatalogSortSelectProps {
  currentSort: string;
}

export default function CatalogSortSelect({ currentSort }: CatalogSortSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <select
      className="bg-card text-foreground border border-border rounded-md text-xs py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-primary"
      value={currentSort}
      onChange={handleSortChange}
    >
      <option value="newest">Más recientes</option>
      <option value="price-asc">Precio: Bajo a Alto</option>
      <option value="price-desc">Precio: Alto a Bajo</option>
    </select>
  );
}
