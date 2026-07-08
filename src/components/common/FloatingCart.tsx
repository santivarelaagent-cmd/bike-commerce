"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCart } from "@/providers/CartProvider";
import { ShoppingCart, MessageSquare, ArrowRight, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { useRouter } from "next/navigation";

export default function FloatingCart() {
  const { cart, updateQuantity, removeFromCart, cartTotal, cartCount } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");
  const router = useRouter();

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.toUpperCase() === "BIKE20") {
      setCouponApplied(true);
      setCouponError("");
    } else {
      setCouponError("Cupón inválido");
      setCouponApplied(false);
    }
  };

  const handleProceedToCheckout = () => {
    setIsOpen(false);
    const checkoutUrl = couponApplied ? "/checkout?coupon=BIKE20" : "/checkout";
    router.push(checkoutUrl);
  };

  const discount = couponApplied ? cartTotal * 0.2 : 0;
  const finalTotal = cartTotal - discount;

  return (
    <>
      {/* Stacked Floating Action Buttons (FAB) */}
      <div className="fixed bottom-6 right-6 z-[90] flex flex-col gap-3 items-end">
        {/* WhatsApp FAB */}
        <a
          href="https://wa.me/5491133334444?text=Hola!%20Tengo%20una%20consulta%20sobre%20las%20bicicletas%20de%20Mango%20Bike."
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 transition-transform duration-200"
          title="Contactar por WhatsApp"
        >
          <MessageSquare className="w-6 h-6 fill-white text-[#25D366]" />
        </a>

        {/* Cart FAB */}
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform duration-200 focus:outline-none"
          title="Ver Carrito"
        >
          <ShoppingCart className="w-6 h-6" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-[10px] font-extrabold text-destructive-foreground animate-bounce">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Slide-over Drawer Overlay */}
      <div
        onClick={() => setIsOpen(false)}
        className={cn(
          "fixed inset-0 bg-black/60 z-[100] transition-opacity duration-300 pointer-events-none opacity-0",
          isOpen && "pointer-events-auto opacity-100"
        )}
      />

      {/* Slide-over Drawer Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-[450px] bg-card border-l border-border shadow-2xl z-[101] flex flex-col transition-transform duration-300 transform translate-x-full",
          isOpen && "translate-x-0"
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
              title="Cerrar"
            >
              <ArrowRight className="w-5 h-5 text-foreground" />
            </button>
            <h2 className="text-xl font-bold text-foreground">Revisa tu carrito</h2>
          </div>
          <span className="flex h-7 w-7 items-center justify-center rounded bg-muted text-xs font-bold text-foreground">
            {cartCount}
          </span>
        </div>

        {/* Drawer Content - Items List */}
        <div className="flex-grow overflow-y-auto px-6 py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <ShoppingCart className="w-12 h-12 text-muted-foreground" />
              <p className="text-sm font-semibold text-muted-foreground">Tu carrito está vacío</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-4 border-b border-border/60 pb-4">
                {/* Product Image */}
                <div className="w-20 h-20 bg-muted/30 border border-border rounded-lg p-1.5 flex items-center justify-center shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                </div>

                {/* Product Info */}
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground line-clamp-2 uppercase leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-xs font-bold text-primary mt-1">
                      $ {item.price.toLocaleString("es-AR")}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-xs font-semibold text-muted-foreground hover:text-destructive text-left underline mt-1 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>

                {/* Quantity Controls - Stacked Vertically */}
                <div className="flex flex-col items-center justify-between border border-border rounded-md bg-muted/20 w-8 py-0.5 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1 w-full text-center hover:text-primary text-xs font-bold transition-colors"
                  >
                    +
                  </button>
                  <span className="text-xs font-bold text-foreground">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 w-full text-center hover:text-primary text-xs font-bold transition-colors"
                  >
                    -
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer - Pricing Summary */}
        {cart.length > 0 && (
          <div className="border-t border-border bg-muted/10 p-6 space-y-4">
            {/* Coupon Accordion */}
            <div className="border-b border-border/60 pb-3">
              <button
                onClick={() => setCouponOpen(!couponOpen)}
                className="flex w-full items-center justify-between text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
              >
                <span>¿Tienes un código de descuento?</span>
                {couponOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {couponOpen && (
                <form onSubmit={handleApplyCoupon} className="flex gap-2 mt-3 animate-in slide-in-from-top-1 duration-150">
                  <input
                    type="text"
                    placeholder="Ej. BIKE20"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-grow h-9 px-3 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                  <button
                    type="submit"
                    className="h-9 px-4 rounded-lg bg-muted border border-border hover:bg-card text-xs font-bold transition-colors text-foreground"
                  >
                    Validar
                  </button>
                </form>
              )}

              {couponApplied && (
                <p className="text-xs text-green-500 font-bold mt-2">
                  ✓ ¡Cupón BIKE20 (20% de descuento) aplicado con éxito!
                </p>
              )}
              {couponError && <p className="text-xs text-destructive font-bold mt-2">✗ {couponError}</p>}
            </div>

            {/* Price Calculations */}
            <div className="space-y-1.5 text-sm font-semibold">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>$ {cartTotal.toLocaleString("es-AR")}</span>
              </div>
              {couponApplied && (
                <div className="flex justify-between text-green-500">
                  <span>Descuento (20%)</span>
                  <span>- $ {discount.toLocaleString("es-AR")}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-foreground border-t border-border/40 pt-2">
                <span>Total</span>
                <span>$ {finalTotal.toLocaleString("es-AR")}</span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={handleProceedToCheckout}
              className="w-full flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-extrabold text-sm hover:opacity-90 transition-opacity"
            >
              <span>Proceder a la compra</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
