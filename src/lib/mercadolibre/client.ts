import { env } from "@/config/env";

if (!env.isServer) {
  throw new Error("Mercado Libre Client can only be loaded on the server");
}

const serverEnv = env as Extract<typeof env, { isServer: true }>;

export const mercadoLibreConfig = {
  clientId: serverEnv.MERCADOLIBRE_CLIENT_ID,
  clientSecret: serverEnv.MERCADOLIBRE_CLIENT_SECRET,
  accessToken: serverEnv.MERCADOLIBRE_ACCESS_TOKEN,
  apiUrl: "https://api.mercadolibre.com",
};
