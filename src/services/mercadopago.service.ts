import { Preference, Payment } from "mercadopago";
import { mercadoPagoConfig } from "@/lib/mercadopago/client";
import { env } from "@/config/env";

if (!env.isServer) {
  throw new Error("Mercado Pago Service can only be loaded on the server");
}

const serverEnv = env as Extract<typeof env, { isServer: true }>;

export interface CreatePreferenceItem {
  title: string;
  quantity: number;
  unitPrice: number;
}

export class MercadoPagoService {
  /**
   * Generates a checkout preference and returns the redirection URL
   */
  static async createPreference(
    orderId: string,
    items: CreatePreferenceItem[],
    userEmail: string
  ): Promise<string> {
    const isMock = serverEnv.MERCADOPAGO_ACCESS_TOKEN.includes("placeholder");

    if (isMock) {
      console.log(`[Mock MercadoPago] Generating preference for Order: ${orderId}`);
      // Return a simulated sandbox sandbox/checkout URL
      return `${serverEnv.NEXT_PUBLIC_APP_URL}/checkout/mock-pay?orderId=${orderId}`;
    }

    try {
      const preference = new Preference(mercadoPagoConfig);
      const response = await preference.create({
        body: {
          items: items.map((item) => ({
            id: orderId,
            title: item.title,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            currency_id: "ARS",
          })),
          payer: {
            email: userEmail,
          },
          external_reference: orderId,
          back_urls: {
            success: `${env.NEXT_PUBLIC_APP_URL}/checkout/success?orderId=${orderId}`,
            failure: `${env.NEXT_PUBLIC_APP_URL}/checkout/failure?orderId=${orderId}`,
            pending: `${env.NEXT_PUBLIC_APP_URL}/checkout/pending?orderId=${orderId}`,
          },
          auto_return: "approved",
          notification_url: `${env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
        },
      });

      // return init_point or sandbox_init_point
      return response.init_point || response.sandbox_init_point || "";
    } catch (error) {
      console.error("❌ Error creating Mercado Pago payment preference:", error);
      // Fail-safe redirect to local fallback checkout
      return `${env.NEXT_PUBLIC_APP_URL}/checkout/mock-pay?orderId=${orderId}`;
    }
  }

  /**
   * Fetches payment information from Mercado Pago
   */
  static async getPaymentDetails(paymentId: string) {
    const isMock = serverEnv.MERCADOPAGO_ACCESS_TOKEN.includes("placeholder");

    if (isMock || paymentId.startsWith("mock_")) {
      console.log(`[Mock MercadoPago] Fetching payment details for ID: ${paymentId}`);
      // Extract orderId if formatted as mock_pay_{orderId}
      const externalReference = paymentId.startsWith("mock_pay_")
        ? paymentId.replace("mock_pay_", "")
        : "mock-order-id";
      
      const status = paymentId.includes("reject") ? "rejected" : "approved";

      return {
        status,
        amount: 2199.99,
        externalReference,
        raw: { status, id: paymentId, transaction_amount: 2199.99 },
      };
    }

    try {
      const payment = new Payment(mercadoPagoConfig);
      const response = await payment.get({ id: paymentId });

      return {
        status: response.status || "pending",
        amount: response.transaction_amount || 0,
        externalReference: response.external_reference,
        raw: response,
      };
    } catch (error) {
      console.error(`❌ Error fetching details for Mercado Pago payment ${paymentId}:`, error);
      throw error;
    }
  }
}
