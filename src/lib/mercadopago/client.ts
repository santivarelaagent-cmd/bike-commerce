import { MercadoPagoConfig } from "mercadopago";
import { env } from "@/config/env";

if (!env.isServer) {
  throw new Error("Mercado Pago client can only be loaded on the server");
}

const serverEnv = env as Extract<typeof env, { isServer: true }>;

export const mercadoPagoConfig = new MercadoPagoConfig({
  accessToken: serverEnv.MERCADOPAGO_ACCESS_TOKEN,
});
