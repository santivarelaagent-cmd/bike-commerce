import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "@/config/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Simulated mock database tables for offline fallback
const mockCategories = [
  { id: "cat-mountain", name: "Mountain", slug: "mountain-bikes" },
  { id: "cat-road", name: "Ruta", slug: "road-bikes" },
  { id: "cat-electric", name: "E-Bikes", slug: "electric-bikes" },
];

const mockBrands = [
  { id: "brand-specialized", name: "Specialized", slug: "specialized" },
  { id: "brand-trek", name: "Trek", slug: "trek" },
  { id: "brand-giant", name: "Giant", slug: "giant" },
];

const mockProducts = [
  {
    id: "prod-stumpjumper",
    name: "Stumpjumper Alloy 29",
    slug: "stumpjumper-alloy-29",
    description: "La Stumpjumper Alloy trae toda la geometría moderna y suspensión activa a un cuadro de aleación duradero.",
    price: 2199.99,
    images: ["https://images.unsplash.com/photo-1576435465679-64a037f487fb?q=80&w=600"],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    brandId: "brand-specialized",
    categoryId: "cat-mountain",
    brand: mockBrands[0],
    category: mockCategories[0],
    reference: { id: "ref-stump", firebaseKey: "prod_stumpjumper", mlId: "MLA12345", sku: "SP-STUMP-29" },
  },
  {
    id: "prod-domane",
    name: "Trek Domane AL 2",
    slug: "trek-domane-al-2",
    description: "La Domane AL 2 es la puerta de entrada perfecta al ciclismo de ruta cómodo y veloz.",
    price: 1099.99,
    images: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=600"],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    brandId: "brand-trek",
    categoryId: "cat-road",
    brand: mockBrands[1],
    category: mockCategories[1],
    reference: { id: "ref-domane", firebaseKey: "prod_domane", mlId: "MLA54321", sku: "TR-DOM-AL2" },
  },
  {
    id: "prod-roam",
    name: "Giant Roam E+ GTS",
    slug: "giant-roam-e-gts",
    description: "Eléctrica híbrida diseñada para aventuras urbanas y senderos mixtos.",
    price: 2499.99,
    images: ["https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=600"],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    brandId: "brand-giant",
    categoryId: "cat-electric",
    brand: mockBrands[2],
    category: mockCategories[2],
    reference: { id: "ref-roam", firebaseKey: "prod_roam", mlId: "MLA99999", sku: "GI-ROAM-EGTS" },
  },
];

const createPrismaClient = () => {
  // Safe-guard for client-side evaluation contexts
  if (typeof window !== "undefined") {
    return new PrismaClient();
  }

  const serverEnv = env as Extract<typeof env, { isServer: true }>;
  const pool = new Pool({
    connectionString: serverEnv.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
  });
  const adapter = new PrismaPg(pool);

  // Disable engine logging to stderr to prevent Next.js Turbopack error overlay on connection loss
  const rawClient = new PrismaClient({
    adapter,
    log: [],
  });

  // Create proxy to intercept database queries and gracefully catch connection errors
  const proxyClient = new Proxy(rawClient, {
    get(target: any, prop: string | symbol) {
      const value = target[prop];

      // Intercept model properties (e.g. prisma.product, prisma.user)
      const isModel = typeof prop === "string" && !prop.startsWith("$") && !prop.startsWith("_");

      if (isModel && value && typeof value === "object") {
        return new Proxy(value, {
          get(modelTarget: any, modelProp: string | symbol) {
            const method = modelTarget[modelProp];

            if (typeof method === "function") {
              return async function (...args: any[]) {
                try {
                  return await method.apply(modelTarget, args);
                } catch (error: any) {
                  const errorMessage = error?.message || "";
                  const isConnectionError =
                    errorMessage.includes("P1000") ||
                    errorMessage.includes("Authentication failed") ||
                    errorMessage.includes("connect ECONNREFUSED") ||
                    errorMessage.includes("Database server") ||
                    errorMessage.includes("driverAdapterError") ||
                    error?.code === "P1000";

                  if (isConnectionError) {
                    console.warn(
                      `⚠️ [Prisma Proxy] Database offline. Returning simulated mock data for: ${String(prop)}.${String(modelProp)}.`
                    );

                    const modelName = String(prop);
                    const methodName = String(modelProp);

                    // Mock Products Fallbacks
                    if (modelName === "product") {
                      if (methodName === "findMany") {
                        const where = args[0]?.where || {};
                        let list = [...mockProducts];
                        if (where.isActive === true) {
                          list = list.filter((p) => p.isActive);
                        }
                        if (where.category?.slug) {
                          list = list.filter((p) => p.category.slug === where.category.slug);
                        }
                        if (where.brand?.slug) {
                          list = list.filter((p) => p.brand.slug === where.brand.slug);
                        }
                        if (args[0]?.take) {
                          list = list.slice(0, args[0].take);
                        }
                        return list;
                      }

                      if (methodName === "findUnique") {
                        const where = args[0]?.where || {};
                        if (where.slug) {
                          return mockProducts.find((p) => p.slug === where.slug) || null;
                        }
                        if (where.id) {
                          return mockProducts.find((p) => p.id === where.id) || null;
                        }
                      }
                    }

                    // Mock Categories Fallbacks
                    if (modelName === "category") {
                      if (methodName === "findMany") {
                        return mockCategories;
                      }
                    }

                    // Mock Brands Fallbacks
                    if (modelName === "brand") {
                      if (methodName === "findMany") {
                        return mockBrands;
                      }
                    }

                    // General Fallbacks by return type structure
                    if (
                      methodName.includes("findMany") ||
                      methodName.includes("Many") ||
                      methodName.includes("groupBy")
                    ) {
                      return [];
                    }
                    if (methodName.includes("count")) {
                      return 0;
                    }
                    if (methodName.includes("aggregate")) {
                      return { _sum: { total: 0 }, _count: 0, _avg: {} };
                    }
                    return null;
                  }

                  throw error;
                }
              };
            }

            return method;
          },
        });
      }

      return typeof value === "function" ? value.bind(target) : value;
    },
  });

  return proxyClient as unknown as PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "@prisma/client";
export default prisma;
