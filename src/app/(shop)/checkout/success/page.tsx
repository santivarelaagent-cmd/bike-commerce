import React from "react";
import Link from "next/link";
import { CheckCircle2, ShoppingBag, ArrowRight } from "lucide-react";

interface SuccessPageProps {
  searchParams: Promise<{
    orderId?: string;
  }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const orderId = params.orderId || "";

  return (
    <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6 lg:px-8 text-center space-y-6">
      <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div>
        <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">
          Pago Aprobado
        </span>
        <h1 className="text-3xl font-extrabold text-foreground mt-4">¡Gracias por tu compra!</h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
          Tu pago ha sido procesado con éxito. Hemos enviado un correo con los detalles del pedido y la factura correspondiente.
        </p>
      </div>

      {orderId && (
        <div className="bg-card border border-border p-4 rounded-xl max-w-sm mx-auto flex flex-col gap-1.5">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            Código de Pedido
          </span>
          <span className="font-mono text-sm text-foreground select-all font-bold">
            {orderId}
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 max-w-md mx-auto">
        <Link
          href="/profile"
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 h-12 rounded-full border border-border bg-card hover:bg-muted text-foreground font-semibold transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Ver mis Pedidos</span>
        </Link>
        <Link
          href="/products"
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 h-12 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
        >
          <span>Seguir Comprando</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
