import { mercadoLibreConfig } from "@/lib/mercadolibre/client";
import { env } from "@/config/env";

if (!env.isServer) {
  throw new Error("Mercado Libre Service can only be loaded on the server");
}

const serverEnv = env as Extract<typeof env, { isServer: true }>;

export class MercadoLibreService {
  /**
   * Updates the listing stock and price in Mercado Libre
   */
  static async updateListing(mlId: string, stock: number, price: number): Promise<void> {
    const isMock = serverEnv.MERCADOLIBRE_ACCESS_TOKEN.includes("placeholder");

    if (isMock) {
      console.log(`[Mock MercadoLibre] Syncing Listing ${mlId}: stock=${stock}, price=${price}`);
      return;
    }

    try {
      const response = await fetch(`${mercadoLibreConfig.apiUrl}/items/${mlId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${mercadoLibreConfig.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          available_quantity: stock,
          price: price,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      console.log(`[MercadoLibre] Sync successful for listing ${mlId}.`);
    } catch (error) {
      console.error(`❌ Error updating Mercado Libre listing ${mlId}:`, error);
      // We log but don't crash, ensuring decoupled behavior
    }
  }

  /**
   * Fetches order details from Mercado Libre (e.g. upon webhook notification)
   */
  static async getOrderDetails(orderId: string) {
    const isMock = serverEnv.MERCADOLIBRE_ACCESS_TOKEN.includes("placeholder");

    if (isMock || orderId.startsWith("mock_")) {
      console.log(`[Mock MercadoLibre] Fetching order details for ID: ${orderId}`);
      return {
        id: orderId,
        buyer: { nickname: "MOCK_BUYER", email: "mock_buyer@meli.com" },
        order_items: [
          {
            item: { id: "MLA876543210", title: "Stumpjumper Alloy 29" },
            quantity: 1,
            unit_price: 2199.99,
          },
        ],
        total_amount: 2199.99,
      };
    }

    try {
      const response = await fetch(`${mercadoLibreConfig.apiUrl}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${mercadoLibreConfig.accessToken}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ Error fetching Mercado Libre order ${orderId}:`, error);
      throw error;
    }
  }
}
