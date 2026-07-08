import React from "react";
import Link from "next/link";
import { XCircle, RefreshCw, ShoppingBag } from "lucide-react";

interface FailurePageProps {
  searchParams: Promise<{
    orderId?: string;
  }>;
}

export default async function FailurePage({ searchParams }: FailurePageProps) {
  const params = await searchParams;
  const orderId = params.orderId || "";

  return (
    <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6 lg:px-8 text-center space-y-6">
      <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
        <XCircle className="w-10 h-10" />
      </div>

      <div>
        <span className="text-xs font-bold text-destructive uppercase tracking-widest bg-destructive/10 px-3 py-1 rounded-full">
          Pago Rechazado
        </span>
        <h1 className="text-3xl font-extrabold text-foreground mt-4">No pudimos procesar tu pago</h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
          Hubo un problema al autorizar la transacción con tu tarjeta de crédito o débito. Por favor, intenta de nuevo o utiliza otro medio de pago.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 max-w-md mx-auto">
        <Link
          href="/cart"
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 h-12 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Volver al Carrito</span>
        </Link>
        <Link
          href="/products"
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 h-12 rounded-full border border-border bg-card hover:bg-muted text-foreground font-semibold transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Explorar Productos</span>
        </Link>
      </div>
    </div>
  );
}
