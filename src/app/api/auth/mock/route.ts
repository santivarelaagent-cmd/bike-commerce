import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma/client";

export async function POST(request: Request) {
  try {
    const { role } = await request.json();
    const cookieStore = await cookies();

    // Ensure mock users exist in Postgres database
    let id = "mock-customer-uuid";
    let email = "customer@gmail.com";
    let name = "Juan Perez";

    if (role === "ADMIN") {
      id = "mock-admin-uuid";
      email = "admin@bikecommerce.com";
      name = "Admin Bike Shop";
    }

    try {
      // Verify or create user in local Postgres
      await prisma.user.upsert({
        where: { id },
        update: { role },
        create: {
          id,
          email,
          name,
          role,
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200",
        },
      });
    } catch (dbError) {
      console.warn(
        "⚠️ Database is offline/unreachable. Bypassing Postgres sync and setting session cookie anyway.",
        dbError
      );
    }

    // Set cookie that the middleware and server clients will check
    cookieStore.set("sb-mock-user", id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mock login error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
