"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCart } from "@/providers/CartProvider";
import { processCheckout } from "@/actions/checkout";

const addressFormSchema = z.object({
  street: z.string().min(5, "Dirección completa (calle y altura) requerida"),
  city: z.string().min(3, "La ciudad es requerida"),
  state: z.string().min(3, "La provincia/estado es requerida"),
  postalCode: z.string().min(4, "Código postal requerido"),
  country: z.string().min(3, "El país es requerido"),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

interface CheckoutPageProps {
  searchParams: Promise<{
    coupon?: string;
  }>;
}

export default function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const router = useRouter();
  const params = use(searchParams);
  const couponCode = params.coupon || "";
  const { cart, cartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const discountPercent = couponCode.toUpperCase() === "BIKE20" ? 20 : 0;
  const discountAmount = (cartTotal * discountPercent) / 100;
  const finalTotal = cartTotal - discountAmount;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Argentina",
    },
  });

  // Redirect to cart if empty
  useEffect(() => {
    if (cart.length === 0) {
      router.push("/cart");
    }
  }, [cart, router]);

  const onSubmit = async (data: AddressFormValues) => {
    setLoading(true);
    setCheckoutError("");

    const payload = {
      ...data,
      couponCode: couponCode || undefined,
      cartItems: cart.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        firebaseKey: item.firebaseKey,
      })),
    };

    try {
      const response = await processCheckout(payload);

      if (response.success && response.paymentUrl) {
        // Clear local shopping cart before redirecting
        clearCart();
        // Redirect to Mercado Pago checkout gateway
        window.location.href = response.paymentUrl;
      } else {
        setCheckoutError(response.error || "Ocurrió un error inesperado.");
        setLoading(false);
      }
    } catch (error) {
      setCheckoutError("No se pudo conectar con el servidor. Intenta de nuevo.");
      setLoading(false);
    }
  };

  if (cart.length === 0) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al carrito</span>
      </button>

      <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-8">Confirmación de Compra</h1>

      {checkoutError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold p-4 rounded-xl mb-6">
          {checkoutError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Shipping details form */}
        <div className="lg:col-span-7 bg-card border border-border p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-foreground mb-4">Detalles de Envío</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                Calle y Altura
              </label>
              <input
                type="text"
                {...register("street")}
                className="w-full h-10 px-3 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                placeholder="Av. del Libertador 4567, Piso 3"
              />
              {errors.street && (
                <p className="text-destructive text-xs font-semibold mt-1">{errors.street.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                  Ciudad
                </label>
                <input
                  type="text"
                  {...register("city")}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none text-foreground"
                  placeholder="Buenos Aires"
                />
                {errors.city && (
                  <p className="text-destructive text-xs font-semibold mt-1">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                  Provincia / Estado
                </label>
                <input
                  type="text"
                  {...register("state")}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none text-foreground"
                  placeholder="CABA"
                />
                {errors.state && (
                  <p className="text-destructive text-xs font-semibold mt-1">{errors.state.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                  Código Postal
                </label>
                <input
                  type="text"
                  {...register("postalCode")}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none text-foreground"
                  placeholder="1425"
                />
                {errors.postalCode && (
                  <p className="text-destructive text-xs font-semibold mt-1">{errors.postalCode.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1.5">
                  País
                </label>
                <input
                  type="text"
                  {...register("country")}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none text-foreground"
                  placeholder="Argentina"
                />
                {errors.country && (
                  <p className="text-destructive text-xs font-semibold mt-1">{errors.country.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-6 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Procesando pedido...</span>
                </>
              ) : (
                <span>Pagar con Mercado Pago</span>
              )}
            </button>
          </form>
        </div>

        {/* Right Summary Panel */}
        <div className="lg:col-span-5 border border-border bg-muted/30 p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold text-foreground">Tu Compra</h2>

          {/* Cart review */}
          <div className="divide-y divide-border overflow-y-auto max-h-60 pr-2">
            {cart.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-sm gap-2">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover bg-card border border-border"
                  />
                  <div>
                    <h4 className="font-bold text-foreground line-clamp-1">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">Cant: {item.quantity}</p>
                  </div>
                </div>
                <span className="font-semibold text-foreground text-right shrink-0">
                  ${(item.price * item.quantity).toLocaleString("es-AR")}
                </span>
              </div>
            ))}
          </div>

          <hr className="border-border" />

          {/* Final calculations */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-semibold text-foreground">
                ${cartTotal.toLocaleString("es-AR")}
              </span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-emerald-500 font-semibold">
                <span>Descuento cupón</span>
                <span>-${discountAmount.toLocaleString("es-AR")}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Envío</span>
              <span className="font-semibold text-emerald-500 text-xs">Gratis</span>
            </div>
            <hr className="border-border my-2" />
            <div className="flex justify-between text-base font-extrabold text-foreground">
              <span>Total final</span>
              <span>${finalTotal.toLocaleString("es-AR")}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[9px] text-muted-foreground bg-card border border-border p-3 rounded-lg text-center">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>Respaldo total de Mercado Pago. Puedes pagar con saldo, débito o crédito.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
