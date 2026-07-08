import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/config/env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Check for developer mock sign-in bypass
  const mockUserCookie = request.cookies.get("sb-mock-user");
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

    return { supabase: null as any, user: mockUser as any, response };
  }

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return { supabase, user, response };
  } catch (error) {
    return { supabase, user: null, response };
  }
}
