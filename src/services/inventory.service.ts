import { db, isMockFirebase } from "@/lib/firebase/admin";
import prisma from "@/lib/prisma/client";

export interface InventoryItem {
  stock: number;
  price: number;
  availability: boolean;
  mercadoLibreId?: string;
}

// In-memory mock database for fallback
const mockInventoryStore: Record<string, InventoryItem> = {
  prod_stumpjumper_alloy: { stock: 10, price: 2199.99, availability: true, mercadoLibreId: "MLA876543210" },
  prod_trek_domane_sl5: { stock: 4, price: 3299.0, availability: true, mercadoLibreId: "MLA876543211" },
  prod_giant_talon_1: { stock: 0, price: 950.0, availability: false, mercadoLibreId: "MLA876543212" },
  prod_turbo_vado_40: { stock: 3, price: 3999.99, availability: true, mercadoLibreId: "MLA876543213" },
};

export class InventoryService {
  /**
   * Retrieves product inventory from Firebase (or Mock in fallback mode)
   */
  static async getInventory(firebaseKey: string): Promise<InventoryItem> {
    if (isMockFirebase || !db) {
      const mockItem = mockInventoryStore[firebaseKey];
      if (mockItem) return mockItem;
      // Default fallback if not found
      return { stock: 5, price: 999.99, availability: true };
    }

    try {
      const ref = db.ref(`inventory/${firebaseKey}`);
      const snapshot = await ref.once("value");
      const val = snapshot.val();

      if (!val) {
        // Fallback or initialization if path is empty in RTDB
        return { stock: 0, price: 0, availability: false };
      }

      return {
        stock: Number(val.stock ?? 0),
        price: Number(val.price ?? 0),
        availability: Boolean(val.availability ?? false),
        mercadoLibreId: val.mercadoLibreId || undefined,
      };
    } catch (error) {
      console.error(`❌ Error fetching inventory for key ${firebaseKey} from Firebase:`, error);
      // Fail-safe default
      return { stock: 0, price: 0, availability: false };
    }
  }

  /**
   * Updates inventory stock in Firebase and syncs internal database references
   */
  static async updateStock(firebaseKey: string, newStock: number): Promise<void> {
    const availability = newStock > 0;

    if (isMockFirebase || !db) {
      if (mockInventoryStore[firebaseKey]) {
        mockInventoryStore[firebaseKey].stock = newStock;
        mockInventoryStore[firebaseKey].availability = availability;
      } else {
        mockInventoryStore[firebaseKey] = { stock: newStock, price: 999.99, availability };
      }
      console.log(`[Mock Firebase] Updated stock for ${firebaseKey} to ${newStock}`);
      return;
    }

    try {
      const ref = db.ref(`inventory/${firebaseKey}`);
      await ref.update({
        stock: newStock,
        availability: availability,
      });

      console.log(`[Firebase] Updated stock for ${firebaseKey} to ${newStock}`);
    } catch (error) {
      console.error(`❌ Error updating Firebase stock for key ${firebaseKey}:`, error);
      throw error;
    }
  }

  /**
   * Updates inventory price in Firebase
   */
  static async updatePrice(firebaseKey: string, newPrice: number): Promise<void> {
    if (isMockFirebase || !db) {
      if (mockInventoryStore[firebaseKey]) {
        mockInventoryStore[firebaseKey].price = newPrice;
      }
      console.log(`[Mock Firebase] Updated price for ${firebaseKey} to ${newPrice}`);
      return;
    }

    try {
      const ref = db.ref(`inventory/${firebaseKey}`);
      await ref.update({
        price: newPrice,
      });
      console.log(`[Firebase] Updated price for ${firebaseKey} to ${newPrice}`);
    } catch (error) {
      console.error(`❌ Error updating Firebase price for key ${firebaseKey}:`, error);
      throw error;
    }
  }

  /**
   * Find product ref by Mercado Libre listing ID in Postgres database
   */
  static async findProductRefByMlId(mlId: string) {
    return await prisma.productReference.findUnique({
      where: { mercadoLibreId: mlId },
      include: { product: true },
    });
  }

  /**
   * Find product ref by Firebase Key
   */
  static async findProductRefByFirebaseKey(firebaseKey: string) {
    return await prisma.productReference.findUnique({
      where: { firebaseKey },
      include: { product: true },
    });
  }
}
