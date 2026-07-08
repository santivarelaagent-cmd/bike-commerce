import { NextResponse } from "next/server";
import { MercadoPagoService } from "@/services/mercadopago.service";
import { InventoryService } from "@/services/inventory.service";
import { MercadoLibreService } from "@/services/mercadolibre.service";
import { prisma } from "@/lib/prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("📥 Mercado Pago Webhook received:", body);

    // Mercado Pago IPN notification payload can have action/type or live notifications format
    const type = body.type || body.topic;
    const paymentId = body.data?.id || (body.resource ? body.resource.split("/").pop() : null);

    if (type === "payment" && paymentId) {
      // 1. Fetch payment details from Mercado Pago (fully verified in backend)
      const paymentDetails = await MercadoPagoService.getPaymentDetails(paymentId);
      const orderId = paymentDetails.externalReference;
      const status = paymentDetails.status;

      if (!orderId) {
        console.warn(`⚠️ No external_reference (orderId) found for payment: ${paymentId}`);
        return NextResponse.json({ received: true });
      }

      // Find the corresponding order
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: {
            include: {
              product: {
                include: { reference: true },
              },
            },
          },
          user: true,
        },
      });

      if (!order) {
        console.warn(`⚠️ Order not found: ${orderId}`);
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      // Check if status changed
      const currentStatus = order.status;
      let newOrderStatus: "PENDING" | "PAID" | "CANCELLED" = "PENDING";

      if (status === "approved") {
        newOrderStatus = "PAID";
      } else if (status === "rejected" || status === "cancelled") {
        newOrderStatus = "CANCELLED";
      }

      // Update Order and log Payment inside a Prisma transaction
      await prisma.$transaction(async (tx) => {
        // Update order status
        await tx.order.update({
          where: { id: orderId },
          data: { status: newOrderStatus },
        });

        // Upsert payment log
        await tx.payment.upsert({
          where: { transactionId: paymentId },
          update: { status, details: paymentDetails.raw as any },
          create: {
            orderId: orderId,
            paymentMethod: "MERCADOPAGO",
            transactionId: paymentId,
            status: status,
            amount: paymentDetails.amount,
            details: paymentDetails.raw as any,
          },
        });

        // Log audit trail
        await tx.auditLog.create({
          data: {
            action: `PAYMENT_${status.toUpperCase()}`,
            entity: "Order",
            entityId: orderId,
            userId: order.userId,
            details: { paymentId, amount: paymentDetails.amount },
          },
        });
      });

      // If payment is approved and order was not already paid, deduct inventory
      if (status === "approved" && currentStatus !== "PAID") {
        console.log(`🛒 Payment approved for order ${orderId}. Updating inventory...`);

        for (const item of order.orderItems) {
          const productRef = item.product.reference;
          if (!productRef) {
            console.warn(`⚠️ No Firebase product reference found for product: ${item.product.name}`);
            continue;
          }

          // A: Fetch current stock from Firebase
          const inventory = await InventoryService.getInventory(productRef.firebaseKey);
          const currentStock = inventory.stock;
          const newStock = Math.max(0, currentStock - item.quantity);

          // B: Update stock in Firebase (which holds the single source of truth)
          await InventoryService.updateStock(productRef.firebaseKey, newStock);

          // C: Audit logging of inventory change
          await prisma.auditLog.create({
            data: {
              action: "INVENTORY_DEDUCTED",
              entity: "ProductReference",
              entityId: productRef.id,
              userId: order.userId,
              details: {
                firebaseKey: productRef.firebaseKey,
                previousStock: currentStock,
                newStock,
                deducted: item.quantity,
              },
            },
          });

          // D: Sync updated stock to Mercado Libre if configured
          if (productRef.mercadoLibreId) {
            await MercadoLibreService.updateListing(
              productRef.mercadoLibreId,
              newStock,
              inventory.price
            );

            await prisma.auditLog.create({
              data: {
                action: "SYNC_ML_STOCK",
                entity: "ProductReference",
                entityId: productRef.id,
                details: {
                  mercadoLibreId: productRef.mercadoLibreId,
                  stock: newStock,
                },
              },
            });
          }
        }
      }
    }

    // Always respond 200 OK to Mercado Pago to avoid retries
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Error in Mercado Pago webhook handler:", error);
    // Return 500 error to let MP retry, or return 200 with error log
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
