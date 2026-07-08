import React from "react";
import { prisma } from "@/lib/prisma/client";
import OrdersListClient from "@/components/admin/OrdersListClient";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const dbOrders = await prisma.order.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      orderItems: {
        include: {
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Map to clean structure for the client table component
  const orders = dbOrders.map((o) => ({
    id: o.id,
    total: o.total,
    status: o.status as "PENDING" | "PAID" | "SHIPPED" | "CANCELLED",
    createdAt: o.createdAt,
    user: o.user,
    orderItems: o.orderItems.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase,
      product: { name: item.product.name },
    })),
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Pedidos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Supervisa las ventas realizadas y gestiona los estados de envío y facturación.
        </p>
      </div>

      <OrdersListClient initialOrders={orders} />
    </div>
  );
}
