import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { env } from "@/config/env";

if (!env.isServer) {
  throw new Error("Firebase Admin SDK can only be loaded on the server");
}

const serverEnv = env as Extract<typeof env, { isServer: true }>;

let dbInstance: any = null;
let isMockFirebase = false;

const useMockFirebase =
  serverEnv.FIREBASE_PROJECT_ID.includes("placeholder") ||
  serverEnv.FIREBASE_DATABASE_URL.includes("placeholder") ||
  serverEnv.FIREBASE_CLIENT_EMAIL.includes("placeholder");

if (useMockFirebase) {
  console.warn("⚠️ Firebase credentials contain placeholders. Using Mock Inventory Database.");
  isMockFirebase = true;
} else {
  try {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: serverEnv.FIREBASE_PROJECT_ID,
          clientEmail: serverEnv.FIREBASE_CLIENT_EMAIL,
          privateKey: serverEnv.FIREBASE_PRIVATE_KEY,
        }),
        databaseURL: serverEnv.FIREBASE_DATABASE_URL,
      });
    }
    dbInstance = getDatabase();
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK. Falling back to Mock Inventory.", error);
    isMockFirebase = true;
  }
}

export const db = dbInstance;
export { isMockFirebase };
