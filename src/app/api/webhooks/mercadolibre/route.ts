import { NextResponse } from "next/server";
import { MercadoLibreService } from "@/services/mercadolibre.service";
import { InventoryService } from "@/services/inventory.service";
import { prisma } from "@/lib/prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("📥 Mercado Libre Webhook received:", body);

    const topic = body.topic;
    const resource = body.resource; // e.g. "/orders/20000035085"

    if (topic === "orders" && resource) {
      const orderId = resource.split("/").pop();

      if (orderId) {
        // Fetch order details from Mercado Libre
        const mlOrder = await MercadoLibreService.getOrderDetails(orderId);

        for (const item of mlOrder.order_items) {
          const mlItemId = item.item.id; // e.g. "MLA876543210"
          const quantitySold = Number(item.quantity || 1);

          // Find our corresponding product reference in PostgreSQL
          const productRef = await prisma.productReference.findUnique({
            where: { mercadoLibreId: mlItemId },
            include: { product: true },
          });

          if (!productRef) {
            console.warn(`⚠️ Received Mercado Libre sale for unknown item: ${mlItemId}`);
            continue;
          }

          // Fetch current stock from Firebase
          const inventory = await InventoryService.getInventory(productRef.firebaseKey);
          const currentStock = inventory.stock;
          const newStock = Math.max(0, currentStock - quantitySold);

          // Update stock in Firebase (the single source of truth for stock)
          await InventoryService.updateStock(productRef.firebaseKey, newStock);

          // Log sync event in AuditLog
          await prisma.auditLog.create({
            data: {
              action: "SYNC_ML_SALE",
              entity: "ProductReference",
              entityId: productRef.id,
              details: {
                mlOrderId: orderId,
                mlItemId,
                previousStock: currentStock,
                newStock,
                deducted: quantitySold,
              },
            },
          });

          console.log(
            `[MercadoLibre Sync] Deducted ${quantitySold} units from Firebase for product: ${productRef.product.name}`
          );
        }
      }
    }

    // Response 200 OK is expected by Mercado Libre
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Error in Mercado Libre webhook handler:", error);
    // Respond 500 so they retry if there is an error, or 200 if we want to ignore
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
