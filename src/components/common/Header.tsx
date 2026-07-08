"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, User, Search, Menu, X, LogOut, ShieldAlert } from "lucide-react";
import { useCart } from "@/providers/CartProvider";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/utils/cn";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount } = useCart();
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then((result: any) => {
      setSessionUser(result?.data?.session?.user || null);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: any, session: any) => {
        setSessionUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isAdmin = sessionUser?.user_metadata?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-black tracking-tighter text-primary flex items-center gap-2">
              <img src="/mango.svg" alt="Mango Bike" className="w-8 h-8 object-contain" />
              <span>MANGO BIKE</span>
            </Link>
          </div>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/products"
              className={cn(
                "transition-colors hover:text-primary",
                pathname === "/products" ? "text-primary" : "text-muted-foreground"
              )}
            >
              Catálogo
            </Link>
            <Link
              href="/products?category=mountain-bikes"
              className={cn(
                "transition-colors hover:text-primary",
                pathname.includes("mountain-bikes") ? "text-primary" : "text-muted-foreground"
              )}
            >
              Mountain
            </Link>
            <Link
              href="/products?category=road-bikes"
              className={cn(
                "transition-colors hover:text-primary",
                pathname.includes("road-bikes") ? "text-primary" : "text-muted-foreground"
              )}
            >
              Ruta
            </Link>
            <Link
              href="/products?category=electric-bikes"
              className={cn(
                "transition-colors hover:text-primary",
                pathname.includes("electric-bikes") ? "text-primary" : "text-muted-foreground"
              )}
            >
              E-Bikes
            </Link>
          </nav>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:flex relative max-w-md flex-1">
            <input
              type="text"
              placeholder="Buscar bicicletas, cascos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 px-4 pr-10 rounded-full border border-border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Search trigger - Mobile */}
            <button
              onClick={() => router.push("/products")}
              className="lg:hidden p-2 rounded-full text-muted-foreground hover:text-primary"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Admin trigger */}
            {isAdmin && (
              <Link
                href="/admin"
                className="p-2 rounded-full text-amber-500 hover:text-amber-400 bg-amber-500/10 border border-amber-500/20 flex items-center gap-1 text-xs font-semibold"
                title="Panel de Administración"
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}

            {/* Cart Icon */}
            <Link href="/cart" className="relative p-2 rounded-full text-muted-foreground hover:text-primary transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Profile Dropdown or Login */}
            {sessionUser ? (
              <div className="flex items-center gap-2">
                <Link href="/profile" className="flex items-center gap-2 hover:opacity-80">
                  {sessionUser.user_metadata?.avatar_url ? (
                    <img
                      src={sessionUser.user_metadata.avatar_url}
                      alt={sessionUser.user_metadata.full_name || "Profile"}
                      className="w-8 h-8 rounded-full border border-border"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {sessionUser.email?.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden md:flex p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-primary text-primary-foreground hover:opacity-90 font-medium text-sm transition-opacity"
              >
                <User className="w-4 h-4" />
                <span>Ingresar</span>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full text-muted-foreground hover:text-primary"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-4 animate-in slide-in-from-top duration-200">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 px-4 pr-10 rounded-full border border-border bg-muted/50 text-sm focus:outline-none"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search className="w-4 h-4" />
            </button>
          </form>
          <div className="flex flex-col space-y-3 font-medium text-base">
            <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary">
              Catálogo Completo
            </Link>
            <Link href="/products?category=mountain-bikes" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary">
              Mountain Bikes
            </Link>
            <Link href="/products?category=road-bikes" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary">
              Road Bikes
            </Link>
            <Link href="/products?category=electric-bikes" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary">
              Electric Bikes
            </Link>
            {sessionUser && (
              <>
                <hr className="border-border" />
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary">
                  Mi Perfil / Pedidos
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="text-left text-destructive flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
