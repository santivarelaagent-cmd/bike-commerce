import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/config/env";

export const createClient = () => {
  // If in browser and sb-mock-user cookie is set, return mock actions
  if (typeof window !== "undefined") {
    const cookies = document.cookie.split(";").reduce((acc, c) => {
      const [key, val] = c.trim().split("=");
      acc[key] = val;
      return acc;
    }, {} as Record<string, string>);

    const mockUserId = cookies["sb-mock-user"];
    if (mockUserId) {
      const role = mockUserId === "mock-admin-uuid" ? "ADMIN" : "CUSTOMER";
      const email = mockUserId === "mock-admin-uuid" ? "admin@bikecommerce.com" : "customer@gmail.com";
      const name = mockUserId === "mock-admin-uuid" ? "Admin Bike Shop" : "Juan Perez";

      const mockUser = {
        id: mockUserId,
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
          onAuthStateChange: (callback: any) => {
            // Immediately call the callback with the mock session
            callback("SIGNED_IN", { user: mockUser, access_token: "mock-jwt" });
            return {
              data: {
                subscription: { unsubscribe: () => {} },
              },
            };
          },
          signOut: async () => {
            // Delete cookie client side
            document.cookie = "sb-mock-user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            window.location.reload();
            return { error: null };
          },
        },
      } as any;
    }
  }

  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};
