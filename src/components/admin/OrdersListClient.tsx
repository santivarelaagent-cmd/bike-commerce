"use client";

import React, { useState } from "react";
import { CheckCircle2, Truck, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { updateAdminOrderStatus } from "@/actions/admin";
import { cn } from "@/utils/cn";

interface OrderRow {
  id: string;
  total: number;
  status: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
  };
  orderItems: Array<{
    id: string;
    quantity: number;
    priceAtPurchase: number;
    product: { name: string };
  }>;
}

interface OrdersListClientProps {
  initialOrders: OrderRow[];
}

export default function OrdersListClient({ initialOrders }: OrdersListClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateStatus = async (orderId: string, status: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED") => {
    setUpdatingId(orderId);
    try {
      const response = await updateAdminOrderStatus(orderId, status);
      if (response.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
      } else {
        alert(response.error || "Error al actualizar estado");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">Listado de Pedidos</h2>
      </div>

      <div className="overflow-x-auto">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            No se han registrado pedidos en la plataforma aún.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                <th className="p-4">ID Pedido</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Detalle Items</th>
                <th className="p-4">Fecha</th>
                <th className="p-4">Total</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {orders.map((order) => {
                const isUpdating = updatingId === order.id;

                return (
                  <tr key={order.id} className="hover:bg-muted/10">
                    {/* ID */}
                    <td className="p-4 font-mono font-bold text-foreground">
                      #{order.id.slice(0, 8)}
                    </td>

                    {/* Customer */}
                    <td className="p-4">
                      <p className="font-bold text-foreground">{order.user.name || "Cliente"}</p>
                      <span className="text-[10px] text-muted-foreground">{order.user.email}</span>
                    </td>

                    {/* Items */}
                    <td className="p-4 text-muted-foreground max-w-xs truncate">
                      {order.orderItems.map((item) => (
                        <div key={item.id}>
                          {item.product.name} ({item.quantity} u.)
                        </div>
                      ))}
                    </td>

                    {/* Date */}
                    <td className="p-4 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("es-AR")}
                    </td>

                    {/* Total */}
                    <td className="p-4 font-bold text-foreground">
                      ${order.total.toLocaleString("es-AR")}
                    </td>

                    {/* Status badge */}
                    <td className="p-4">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px]",
                          order.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : order.status === "SHIPPED"
                            ? "bg-blue-500/10 text-blue-500"
                            : order.status === "CANCELLED"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-amber-500/10 text-amber-500"
                        )}
                      >
                        {order.status}
                      </span>
                    </td>

                    {/* Admin status update buttons */}
                    <td className="p-4 text-right">
                      {isUpdating ? (
                        <div className="inline-flex items-center gap-1 text-muted-foreground">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                          <span>Guardando...</span>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          {order.status === "PAID" && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, "SHIPPED")}
                              className="px-2.5 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold text-[10px]"
                              title="Marcar como Enviado"
                            >
                              Enviar Pedido
                            </button>
                          )}
                          {order.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(order.id, "PAID")}
                                className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-[10px]"
                                title="Aprobar Pago"
                              >
                                Aprobar Pago
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(order.id, "CANCELLED")}
                                className="px-2.5 py-1 rounded bg-destructive hover:bg-destructive/90 text-white font-semibold text-[10px]"
                                title="Cancelar Pedido"
                              >
                                Cancelar
                              </button>
                            </>
                          )}
                          {(order.status === "SHIPPED" || order.status === "CANCELLED") && (
                            <span className="text-[10px] text-muted-foreground italic">Completado</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
