import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  
  // Clear the mock user cookie server-side to break any HTTP-Only deadlocks
  cookieStore.delete("sb-mock-user");
  cookieStore.set("sb-mock-user", "", { 
    path: "/", 
    maxAge: 0,
    httpOnly: false 
  });
  cookieStore.set("sb-mock-user", "", { 
    path: "/", 
    maxAge: 0,
    httpOnly: true 
  });

  return NextResponse.redirect(new URL("/login", request.url));
}
