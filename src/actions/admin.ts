"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { InventoryService } from "@/services/inventory.service";
import { MercadoLibreService } from "@/services/mercadolibre.service";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const productFormSchema = z.object({
  name: z.string().min(3, "El nombre es requerido"),
  slug: z.string().min(3, "El slug es requerido"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  categoryId: z.string().uuid("Seleccione una categoría válida"),
  brandId: z.string().uuid("Seleccione una marca válida"),
  images: z.array(z.string().url()).min(1, "Debe agregar al menos una imagen"),
  firebaseKey: z.string().min(2, "La clave de Firebase es requerida"),
  mercadoLibreId: z.string().optional(),
  sku: z.string().optional(),
});

export async function saveProduct(id: string | null, rawData: any) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No autorizado" };

    const parsed = productFormSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: "Datos de formulario inválidos" };
    }

    const data = parsed.data;

    await prisma.$transaction(async (tx) => {
      let product;

      if (id) {
        // Update product
        product = await tx.product.update({
          where: { id },
          data: {
            name: data.name,
            slug: data.slug,
            description: data.description,
            categoryId: data.categoryId,
            brandId: data.brandId,
            images: data.images,
          },
        });

        // Update reference
        await tx.productReference.upsert({
          where: { productId: product.id },
          update: {
            firebaseKey: data.firebaseKey,
            mercadoLibreId: data.mercadoLibreId || null,
            sku: data.sku || null,
          },
          create: {
            productId: product.id,
            firebaseKey: data.firebaseKey,
            mercadoLibreId: data.mercadoLibreId || null,
            sku: data.sku || null,
          },
        });
      } else {
        // Create new product
        product = await tx.product.create({
          data: {
            name: data.name,
            slug: data.slug,
            description: data.description,
            categoryId: data.categoryId,
            brandId: data.brandId,
            images: data.images,
            isActive: true,
          },
        });

        // Create reference
        await tx.productReference.create({
          data: {
            productId: product.id,
            firebaseKey: data.firebaseKey,
            mercadoLibreId: data.mercadoLibreId || null,
            sku: data.sku || null,
          },
        });
      }

      // Log in AuditLog
      await tx.auditLog.create({
        data: {
          action: id ? "PRODUCT_UPDATED" : "PRODUCT_CREATED",
          entity: "Product",
          entityId: product.id,
          userId: user.id,
          details: { name: product.name, firebaseKey: data.firebaseKey },
        },
      });
    });

    revalidatePath("/admin/products");
    revalidatePath("/products");
    return { success: true };
  } catch (error: any) {
    console.error("Error saving product:", error);
    return { success: false, error: error.message || "Error al guardar el producto" };
  }
}

export async function updateAdminProductInventory(
  productId: string,
  firebaseKey: string,
  stock: number,
  price: number
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No autorizado" };

    // 1. Update stock and price in Firebase
    await InventoryService.updateStock(firebaseKey, stock);
    await InventoryService.updatePrice(firebaseKey, price);

    // 2. Fetch linked product reference
    const productRef = await prisma.productReference.findUnique({
      where: { firebaseKey },
    });

    // 3. Update Mercado Libre if linked
    if (productRef && productRef.mercadoLibreId) {
      await MercadoLibreService.updateListing(productRef.mercadoLibreId, stock, price);

      await prisma.auditLog.create({
        data: {
          action: "SYNC_ML_INVENTORY",
          entity: "ProductReference",
          entityId: productRef.id,
          userId: user.id,
          details: { stock, price, mercadoLibreId: productRef.mercadoLibreId },
        },
      });
    }

    // 4. Log sync action
    await prisma.auditLog.create({
      data: {
        action: "INVENTORY_SYNCED",
        entity: "Product",
        entityId: productId,
        userId: user.id,
        details: { stock, price, firebaseKey },
      },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/products`);
    return { success: true };
  } catch (error: any) {
    console.error("Error syncing product inventory:", error);
    return { success: false, error: error.message || "Error al sincronizar inventario" };
  }
}

export async function updateAdminOrderStatus(
  orderId: string,
  status: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED"
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No autorizado" };

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        action: `ORDER_STATUS_${status}`,
        entity: "Order",
        entityId: orderId,
        userId: user.id,
        details: { status },
      },
    });

    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating order status:", error);
    return { success: false, error: error.message || "Error al actualizar estado" };
  }
}
