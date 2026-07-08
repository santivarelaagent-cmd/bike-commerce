import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, ShoppingBag, FolderOpen, RefreshCcw, ArrowLeft, ShieldCheck, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/admin");
  }

  // Double check admin role in Postgres to be fully safe, with try-catch connection fallback
  let dbUser: any = null;
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
  } catch (dbError) {
    console.warn(
      "⚠️ Database connection failed in Admin Guard layout. Falling back to session metadata role validation."
    );
  }

  // Fallback to session metadata role if database is offline or user isn't synced yet
  if (!dbUser) {
    if (user.user_metadata?.role === "ADMIN") {
      dbUser = {
        id: user.id,
        role: "ADMIN",
        name: user.user_metadata?.full_name || "Admin Shop",
        avatar: user.user_metadata?.avatar_url || null,
        email: user.email,
      };
    }
  }

  if (dbUser?.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-border bg-card shrink-0 hidden md:flex flex-col justify-between">
        <div className="p-6 space-y-6">
          <Link href="/" className="text-xl font-black tracking-tighter text-primary flex items-center gap-1.5">
            <span>VELOCE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-foreground inline-block"></span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground border border-border px-1.5 py-0.5 rounded ml-2">
              Panel
            </span>
          </Link>

          <nav className="flex flex-col space-y-1.5 pt-4">
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-primary" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/admin/products"
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors"
            >
              <FolderOpen className="w-4 h-4 text-primary" />
              <span>Productos</span>
            </Link>
            <Link
              href="/admin/orders"
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-primary" />
              <span>Pedidos</span>
            </Link>
          </nav>
        </div>

        <div className="p-6 border-t border-border space-y-3">
          <div className="flex items-center gap-3">
            {dbUser.avatar ? (
              <img src={dbUser.avatar} alt="Admin Avatar" className="w-9 h-9 rounded-full border border-border" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                AD
              </div>
            )}
            <div className="truncate">
              <p className="text-xs font-bold text-foreground leading-tight">{dbUser.name || "Admin"}</p>
              <span className="text-[10px] text-muted-foreground font-semibold">Administrador</span>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 w-full h-9 rounded-full border border-border hover:bg-muted text-xs font-bold text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a la Tienda</span>
          </Link>
        </div>
      </aside>

      {/* Main Admin Page Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-card/60 backdrop-blur px-6 flex items-center justify-between">
          <h2 className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>Consola de Administración Segura</span>
          </h2>
          <div className="flex items-center gap-3">
            <Link
              href="/products"
              className="text-xs font-bold text-primary hover:underline md:hidden"
            >
              Tienda
            </Link>
            <span className="text-xs text-muted-foreground font-semibold">Sesión Activa</span>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-grow p-6 sm:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
