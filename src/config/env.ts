import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  FIREBASE_DATABASE_URL: z.string().url(),
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().min(1),
  MERCADOLIBRE_ACCESS_TOKEN: z.string().min(1),
  MERCADOLIBRE_CLIENT_ID: z.string().min(1),
  MERCADOLIBRE_CLIENT_SECRET: z.string().min(1),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

const isServer = typeof window === "undefined";

const getEnv = () => {
  const clientData = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000",
  };

  const clientParsed = clientSchema.safeParse(clientData);

  if (!clientParsed.success) {
    console.error("❌ Invalid client environment variables:", clientParsed.error.format());
    throw new Error("Invalid client environment variables");
  }

  if (isServer) {
    const serverData = {
      DATABASE_URL: process.env.DATABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
      MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN,
      MERCADOPAGO_WEBHOOK_SECRET: process.env.MERCADOPAGO_WEBHOOK_SECRET,
      MERCADOLIBRE_ACCESS_TOKEN: process.env.MERCADOLIBRE_ACCESS_TOKEN,
      MERCADOLIBRE_CLIENT_ID: process.env.MERCADOLIBRE_CLIENT_ID,
      MERCADOLIBRE_CLIENT_SECRET: process.env.MERCADOLIBRE_CLIENT_SECRET,
      NODE_ENV: process.env.NODE_ENV,
    };

    const serverParsed = serverSchema.safeParse(serverData);

    if (!serverParsed.success) {
      console.error("❌ Invalid server environment variables:", serverParsed.error.format());
      throw new Error("Invalid server environment variables");
    }

    return {
      ...clientParsed.data,
      ...serverParsed.data,
      isServer: true as const,
    };
  }

  return {
    ...clientParsed.data,
    isServer: false as const,
  };
};

export const env = getEnv();
export type EnvType = typeof env;
