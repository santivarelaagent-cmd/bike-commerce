import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/config/env";

if (!env.isServer) {
  throw new Error("Supabase server client can only be loaded on the server");
}

const serverEnv = env as Extract<typeof env, { isServer: true }>;

export const createClient = async () => {
  const cookieStore = await cookies();

  // If mock cookie is present, return a mocked client interface
  const mockUserCookie = cookieStore.get("sb-mock-user");
  if (mockUserCookie) {
    const userId = mockUserCookie.value;
    const role = userId === "mock-admin-uuid" ? "ADMIN" : "CUSTOMER";
    const email = userId === "mock-admin-uuid" ? "admin@bikecommerce.com" : "customer@gmail.com";
    const name = userId === "mock-admin-uuid" ? "Admin Bike Shop" : "Juan Perez";

    const mockUser = {
      id: userId,
      email,
      user_metadata: {
        role,
        full_name: name,
        avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200",
      },
      app_metadata: { provider: "google" },
    };

    return {
      auth: {
        getUser: async () => ({ data: { user: mockUser }, error: null }),
        getSession: async () => ({
          data: { session: { user: mockUser, access_token: "mock-jwt" } },
          error: null,
        }),
        signOut: async () => {
          cookieStore.delete("sb-mock-user");
          return { error: null };
        },
      },
    } as any;
  }

  return createServerClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Ignored when called from Server Component
          }
        },
      },
    }
  );
};

export const createAdminClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Ignored
          }
        },
      },
    }
  );
};
