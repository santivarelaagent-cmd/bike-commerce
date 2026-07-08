"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ArrowRight, ShieldCheck, Tag, X } from "lucide-react";
import { useCart } from "@/providers/CartProvider";
import { createClient } from "@/lib/supabase/client";

export default function CartPage() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const [session, setSession] = useState<any>(null);
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then((result: any) => {
      setSession(result.data.session);
    });
  }, [supabase]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    // Seed coupon is BIKE20 (20% off)
    if (couponCode.toUpperCase() === "BIKE20") {
      setDiscountPercent(20);
      setCouponApplied(true);
      setCouponCode("");
    } else {
      setCouponError("Cupón inválido o vencido.");
    }
  };

  const removeCoupon = () => {
    setDiscountPercent(0);
    setCouponApplied(false);
  };

  const discountAmount = (cartTotal * discountPercent) / 100;
  const finalTotal = cartTotal - discountAmount;

  const handleCheckoutRedirect = () => {
    if (!session) {
      router.push("/login?redirectTo=/checkout");
    } else {
      // Pass coupon details in query param or save state
      router.push(`/checkout?coupon=${couponApplied ? "BIKE20" : ""}`);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6 lg:px-8 text-center">
        <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <Trash2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Tu carrito está vacío</h1>
        <p className="text-muted-foreground text-sm mt-2">
          Parece que aún no has agregado productos a tu carrito de compras.
        </p>
        <Link
          href="/products"
          className="mt-8 inline-flex items-center gap-2 px-6 h-12 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
        >
          <span>Explorar Catálogo</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-8">Carrito de Compras</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart items */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-card shadow-xs"
            >
              {/* Product Info */}
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 rounded-xl object-cover bg-muted border border-border shrink-0"
                />
                <div>
                  <h3 className="font-bold text-foreground hover:text-primary">
                    <Link href={`/products/${item.slug}`}>{item.name}</Link>
                  </h3>
                  <p className="text-sm font-semibold text-primary mt-1">
                    ${item.price.toLocaleString("es-AR")} c/u
                  </p>
                </div>
              </div>

              {/* Action and Quantity Controls */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                <div className="flex items-center border border-border rounded-full bg-card overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 hover:bg-muted text-foreground font-bold transition-colors"
                  >
                    -
                  </button>
                  <span className="w-8 h-8 flex items-center justify-center font-bold text-xs text-foreground">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 hover:bg-muted text-foreground font-bold transition-colors"
                  >
                    +
                  </button>
                </div>

                <p className="font-extrabold text-foreground min-w-[80px] text-right">
                  ${(item.price * item.quantity).toLocaleString("es-AR")}
                </p>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Eliminar producto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4 p-6 rounded-2xl border border-border bg-card space-y-6">
          <h2 className="text-lg font-bold text-foreground">Resumen del Pedido</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-semibold text-foreground">
                ${cartTotal.toLocaleString("es-AR")}
              </span>
            </div>

            {couponApplied && (
              <div className="flex justify-between text-emerald-500 font-semibold">
                <span className="flex items-center gap-1">
                  <span>Descuento (20%)</span>
                  <button onClick={removeCoupon} className="text-destructive hover:scale-105">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
                <span>-${discountAmount.toLocaleString("es-AR")}</span>
              </div>
            )}

            <div className="flex justify-between text-muted-foreground">
              <span>Envío</span>
              <span className="font-semibold text-emerald-500 uppercase text-xs">Gratis</span>
            </div>

            <hr className="border-border my-3" />

            <div className="flex justify-between text-base font-extrabold text-foreground">
              <span>Total</span>
              <span>${finalTotal.toLocaleString("es-AR")}</span>
            </div>
          </div>

          {/* Coupon Form */}
          {!couponApplied ? (
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="Código de descuento"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-grow h-9 px-3 rounded-lg border border-border bg-muted/40 text-xs focus:outline-none text-foreground"
              />
              <button
                type="submit"
                className="h-9 px-3 rounded-lg bg-secondary text-secondary-foreground hover:opacity-90 text-xs font-semibold flex items-center gap-1 border border-border"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Aplicar</span>
              </button>
            </form>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold px-3 py-2 rounded-lg flex items-center justify-between">
              <span>Cupón BIKE20 aplicado con éxito!</span>
            </div>
          )}
          {couponError && <p className="text-destructive text-xs font-semibold">{couponError}</p>}

          {/* Checkout Button */}
          <button
            onClick={handleCheckoutRedirect}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <span>Iniciar Compra</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Trust information */}
          <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Transacciones procesadas de forma segura por Mercado Pago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
