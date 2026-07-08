import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { createClient } from "@/lib/supabase/server";
import { ShoppingBag, MapPin, Calendar, CheckCircle2, AlertCircle, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/cn";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/profile");
  }

  // Fetch user orders & addresses from PostgreSQL database
  const [dbUser, orders, addresses] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
    }),
    prisma.order.findMany({
      where: { userId: user.id },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.address.findMany({
      where: { userId: user.id },
    }),
  ]);

  const isAdmin = dbUser?.role === "ADMIN";

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl border border-border bg-card">
        {dbUser?.avatar ? (
          <img src={dbUser.avatar} alt={dbUser.name || "User avatar"} className="w-20 h-20 rounded-full border border-border" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-extrabold border border-primary/20">
            {dbUser?.email?.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="text-center sm:text-left flex-grow">
          <h1 className="text-2xl font-extrabold text-foreground">{dbUser?.name || "Usuario de Mango Bike"}</h1>
          <p className="text-sm text-muted-foreground">{dbUser?.email}</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
            <span className={cn(
              "text-xs font-bold px-2.5 py-0.5 rounded border",
              isAdmin ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-primary/10 text-primary border-primary/20"
            )}>
              Rol: {isAdmin ? "Administrador" : "Cliente"}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
              Cuenta Creada: {dbUser?.createdAt ? new Date(dbUser.createdAt).toLocaleDateString("es-AR") : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Orders History */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Historial de Pedidos</h2>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-2xl">
              <ShoppingBag className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-bold text-foreground">Aún no tienes pedidos</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Cuando realices una compra, verás el historial detallado aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isPaid = order.status === "PAID";
                const isCancelled = order.status === "CANCELLED";

                return (
                  <div
                    key={order.id}
                    className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs"
                  >
                    {/* Header of order card */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">Pedido: #{order.id.slice(0, 8)}</span>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(order.createdAt).toLocaleDateString("es-AR")}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px]",
                          isPaid
                            ? "bg-emerald-500/10 text-emerald-500"
                            : isCancelled
                            ? "bg-destructive/10 text-destructive"
                            : "bg-amber-500/10 text-amber-500"
                        )}
                      >
                        {order.status === "PAID"
                          ? "Pagado"
                          : order.status === "CANCELLED"
                          ? "Cancelado"
                          : "Pendiente"}
                      </span>
                    </div>

                    {/* Products details */}
                    <div className="divide-y divide-border/50">
                      {order.orderItems.map((item) => (
                        <div key={item.id} className="py-2.5 flex justify-between text-sm gap-4">
                          <div>
                            <span className="font-bold text-foreground">{item.product.name}</span>
                            <span className="text-xs text-muted-foreground block">
                              Cant: {item.quantity} &middot; Price: ${item.priceAtPurchase.toLocaleString("es-AR")} c/u
                            </span>
                          </div>
                          <span className="font-semibold text-foreground shrink-0 text-right">
                            ${(item.priceAtPurchase * item.quantity).toLocaleString("es-AR")}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-border flex justify-between items-center text-sm">
                      <span className="font-semibold text-muted-foreground">Total:</span>
                      <span className="font-black text-foreground text-lg">
                        ${order.total.toLocaleString("es-AR")}
                      </span>
                    </div>

                    {/* Payment retry fallback link if PENDING */}
                    {order.status === "PENDING" && (
                      <div className="pt-2 text-right">
                        <Link
                          href={`/checkout/mock-pay?orderId=${order.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Pagar ahora</span>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Addresses */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Direcciones</h2>
          </div>

          {addresses.length === 0 ? (
            <div className="text-center py-8 bg-card border border-border rounded-2xl">
              <p className="text-xs text-muted-foreground">No tienes direcciones guardadas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <div key={address.id} className="p-4 rounded-xl border border-border bg-card space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">{address.street}</span>
                    {address.isDefault && (
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20 font-bold">
                        Por defecto
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {address.city}, {address.state} ({address.postalCode})
                  </p>
                  <p className="text-xs text-muted-foreground">{address.country}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
