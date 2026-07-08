"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { createClient } from "@/lib/supabase/server";
import { InventoryService } from "@/services/inventory.service";
import { MercadoPagoService } from "@/services/mercadopago.service";

const checkoutSchema = z.object({
  street: z.string().min(3, "La calle es requerida"),
  city: z.string().min(2, "La ciudad es requerida"),
  state: z.string().min(2, "La provincia/estado es requerida"),
  postalCode: z.string().min(3, "El código postal es requerido"),
  country: z.string().min(2, "El país es requerido"),
  couponCode: z.string().optional(),
  cartItems: z.array(
    z.object({
      id: z.string().uuid(),
      quantity: z.number().min(1),
      firebaseKey: z.string(),
    })
  ).min(1, "El carrito no puede estar vacío"),
});

export async function processCheckout(rawData: z.infer<typeof checkoutSchema>) {
  try {
    // 1. Authenticate User
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes iniciar sesión para realizar el pedido" };
    }

    // 2. Validate Input Data
    const parsed = checkoutSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: "Datos de envío o carrito inválidos" };
    }

    const { street, city, state, postalCode, country, couponCode, cartItems } = parsed.data;

    // 3. Verify Stock on Firebase before finalizing order
    const validatedItems: Array<{
      productId: string;
      name: string;
      quantity: number;
      priceAtPurchase: number;
    }> = [];
    let orderTotal = 0;

    for (const cartItem of cartItems) {
      const dbProduct = await prisma.product.findUnique({
        where: { id: cartItem.id },
        include: { reference: true },
      });

      if (!dbProduct || !dbProduct.reference) {
        return { success: false, error: `Producto no encontrado en catálogo` };
      }

      // Check live stock in Firebase Realtime Database
      const inventory = await InventoryService.getInventory(dbProduct.reference.firebaseKey);
      if (inventory.stock < cartItem.quantity) {
        return {
          success: false,
          error: `Lo sentimos, ${dbProduct.name} no cuenta con stock suficiente (Stock disponible: ${inventory.stock})`,
        };
      }

      validatedItems.push({
        productId: dbProduct.id,
        name: dbProduct.name,
        quantity: cartItem.quantity,
        priceAtPurchase: inventory.price,
      });

      orderTotal += inventory.price * cartItem.quantity;
    }

    // 4. Handle Coupon discount
    let couponId: string | null = null;
    if (couponCode) {
      const dbCoupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode.toUpperCase(),
          isActive: true,
          expiresAt: { gte: new Date() },
        },
      });

      if (dbCoupon) {
        couponId = dbCoupon.id;
        const discount =
          dbCoupon.discountType === "PERCENTAGE"
            ? (orderTotal * dbCoupon.discountValue) / 100
            : dbCoupon.discountValue;
        orderTotal = Math.max(0, orderTotal - discount);
      }
    }

    // 5. Database inserts inside a transaction
    const checkoutResult = await prisma.$transaction(async (tx) => {
      // Find or create address for this user
      let dbAddress = await tx.address.findFirst({
        where: {
          userId: user.id,
          street,
          city,
          state,
          postalCode,
          country,
        },
      });

      if (!dbAddress) {
        dbAddress = await tx.address.create({
          data: {
            userId: user.id,
            street,
            city,
            state,
            postalCode,
            country,
            isDefault: true,
          },
        });
      }

      // Create the Order
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          status: "PENDING",
          total: orderTotal,
          couponId,
          shippingAddressId: dbAddress.id,
          orderItems: {
            create: validatedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtPurchase: item.priceAtPurchase,
            })),
          },
        },
      });

      // Audit Log log
      await tx.auditLog.create({
        data: {
          action: "ORDER_CREATED",
          entity: "Order",
          entityId: newOrder.id,
          userId: user.id,
          details: { total: orderTotal, itemCount: validatedItems.length },
        },
      });

      return newOrder;
    });

    // 6. Generate Mercado Pago checkout preference link
    const mpPreferenceItems = validatedItems.map((item) => ({
      title: item.name,
      quantity: item.quantity,
      unitPrice: item.priceAtPurchase,
    }));

    const paymentUrl = await MercadoPagoService.createPreference(
      checkoutResult.id,
      mpPreferenceItems,
      user.email!
    );

    return {
      success: true,
      orderId: checkoutResult.id,
      paymentUrl,
    };
  } catch (error) {
    console.error("❌ Error running processCheckout server action:", error);
    return {
      success: false,
      error: "Ocurrió un error inesperado al procesar tu compra. Por favor, intenta de nuevo.",
    };
  }
}
