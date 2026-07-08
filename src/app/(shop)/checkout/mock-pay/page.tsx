"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface MockPayPageProps {
  searchParams: Promise<{
    orderId?: string;
  }>;
}

export default function MockPayPage({ searchParams }: MockPayPageProps) {
  const router = useRouter();
  const params = use(searchParams);
  const orderId = params.orderId || "";
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");

  useEffect(() => {
    if (!orderId) {
      router.push("/cart");
    }
  }, [orderId, router]);

  const processMockPayment = async (approved: boolean) => {
    setLoading(true);
    try {
      const mockPaymentId = `mock_pay_${Date.now()}`;
      
      // Inject payment details mockup on mock query
      // Then trigger our own Mercado Pago webhook route handler!
      const response = await fetch("/api/webhooks/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "payment",
          data: { id: mockPaymentId },
          // The mock payment details query will resolve this to approved and match externalReference to our orderId
        }),
      });

      // Wait, we need to make sure the mock details lookup in MercadoPagoService.getPaymentDetails
      // actually receives this mockup. That's why we coded:
      // if (isMock || paymentId.startsWith("mock_")) { ... return approved status and external_ref }
      // Wait, in our getPaymentDetails implementation, it returned:
      // externalReference: "mock-order-id"
      // Wait! We should make sure the mock details service returns the *actual* orderId passed!
      // Oh, let's double check what getPaymentDetails in mercadopago.service.ts returns:
      // It returns: externalReference: "mock-order-id" !
      // Ah! If it returns "mock-order-id" instead of the actual `orderId`, the webhook won't match our order!
      // Let's check how to fix this: we can pass the orderId inside the mock payment ID, e.g. `mock_pay_${orderId}`.
      // And in mercadopago.service.ts, if the paymentId starts with `mock_pay_`, we extract the orderId from the suffix!
      // Wow! That is incredibly clever and ensures the webhook matches our order dynamically!
      // Let's check: Yes! `mock_pay_${orderId}`. Let's do that!
      const dynamicPaymentId = `mock_pay_${orderId}`;

      const webhookResponse = await fetch("/api/webhooks/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "payment",
          data: { id: dynamicPaymentId },
        }),
      });

      if (webhookResponse.ok) {
        if (approved) {
          setStatus("success");
          setTimeout(() => {
            router.push(`/checkout/success?orderId=${orderId}`);
          }, 1500);
        } else {
          setStatus("error");
          setTimeout(() => {
            router.push(`/checkout/failure?orderId=${orderId}`);
          }, 1500);
        }
      } else {
        alert("Fallo el procesamiento del webhook de Mercado Pago");
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      alert("Error al simular pago");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-center">
      <div className="w-full max-w-md bg-card border border-border p-8 rounded-2xl space-y-6">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            <CreditCard className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Mercado Pago Sandbox</h1>
          <p className="text-xs text-muted-foreground">
            Simulador de pasarela de pago para desarrollo. Pedido: <span className="font-semibold text-foreground">{orderId}</span>
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-6 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-semibold text-foreground">
              {status === "success"
                ? "¡Pago Aprobado! Redirigiendo..."
                : status === "error"
                ? "Pago Rechazado. Redirigiendo..."
                : "Procesando pago simulado..."}
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <button
              onClick={() => processMockPayment(true)}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Aprobar Pago (Simulado)</span>
            </button>
            <button
              onClick={() => processMockPayment(false)}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-full bg-destructive hover:bg-destructive/90 text-white font-semibold transition-colors"
            >
              <XCircle className="w-5 h-5" />
              <span>Rechazar Pago (Simulado)</span>
            </button>
          </div>
        )}

        <div className="bg-muted/40 p-4 rounded-xl text-left border border-border">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">¿Cómo funciona?</h3>
          <p className="text-[10px] text-muted-foreground leading-normal">
            Al elegir una opción, se enviará una notificación simulada al webhook de la aplicación (`/api/webhooks/mercadopago`), actualizando el pedido en Postgres y deduciendo el stock del inventario en Firebase en tiempo real.
          </p>
        </div>
      </div>
    </div>
  );
}
