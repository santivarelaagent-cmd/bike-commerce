import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    const supabase = await createClient();
    
    // Exchange auth code for a session
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      const user = data.user;
      const email = user.email!;
      const name = user.user_metadata?.full_name || user.user_metadata?.name || null;
      const avatar = user.user_metadata?.avatar_url || null;

      try {
        // Check if user exists in our Postgres database
        let dbUser = await prisma.user.findUnique({
          where: { id: user.id },
        });

        if (!dbUser) {
          // Check if this is the first user in the system to make them ADMIN automatically
          const userCount = await prisma.user.count();
          const role = userCount === 0 ? "ADMIN" : "CUSTOMER";

          dbUser = await prisma.user.create({
            data: {
              id: user.id,
              email,
              name,
              avatar,
              role,
            },
          });

          // Sync the role back to Supabase user_metadata so it is included in the JWT
          const supabaseAdmin = await createAdminClient();
          await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: { role },
          });

          // Log user creation
          await prisma.auditLog.create({
            data: {
              action: "USER_REGISTERED",
              entity: "User",
              entityId: dbUser.id,
              userId: dbUser.id,
              details: { email, role, provider: user.app_metadata.provider },
            },
          });
        } else {
          // Optional: Update name or avatar if changed
          if (dbUser.name !== name || dbUser.avatar !== avatar) {
            dbUser = await prisma.user.update({
              where: { id: user.id },
              data: { name, avatar },
            });
          }
        }
      } catch (dbError) {
        console.error("❌ Error syncing authenticated user to PostgreSQL:", dbError);
        // We still redirect the user to the app, but log the database sync error
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
