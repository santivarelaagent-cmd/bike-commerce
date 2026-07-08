"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Bike } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface LoginPageProps {
  searchParams: Promise<{
    redirectTo?: string;
  }>;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const router = useRouter();
  const params = use(searchParams);
  const redirectTo = params.redirectTo || "/";
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (error) throw error;
    } catch (e) {
      console.error("Google Auth failed:", e);
      alert("Error al iniciar sesión con Google");
      setLoading(false);
    }
  };

  // Mock login for offline sandbox testing/development
  const handleMockLogin = async (role: "CUSTOMER" | "ADMIN") => {
    setLoading(true);
    try {
      // Direct session mock injection is not possible, so we call a route handler
      // that sets a mock cookie or uses Supabase dummy email sign-in if possible.
      // But a clean way to mock login is to send a POST request to an API endpoint:
      // `/api/auth/mock` which signs in with a mock user and returns cookies.
      const response = await fetch("/api/auth/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        router.push(redirectTo);
        router.refresh();
      } else {
        alert("Fallo el login simulado");
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      alert("Error en login simulado");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-card border border-border p-8 rounded-2xl shadow-sm text-center">
        {/* Brand Icon */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="p-3 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <img src="/mango.svg" alt="Mango Bike" className="w-12 h-12 object-contain" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter text-foreground">
            MANGO BIKE
          </h2>
          <p className="text-sm text-muted-foreground">Inicia sesión para continuar tu compra</p>
        </div>

        {/* Buttons */}
        <div className="space-y-4 pt-6">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 h-12 rounded-full border border-border hover:bg-muted text-foreground font-semibold transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            <span>Continuar con Google</span>
          </button>

          {/* Separation line */}
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-4 text-muted-foreground text-xs font-semibold uppercase">
              Modo Desarrollo
            </span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleMockLogin("CUSTOMER")}
              disabled={loading}
              className="h-10 text-xs font-bold rounded-lg bg-secondary text-secondary-foreground border border-border hover:opacity-90 transition-opacity"
            >
              Simular Cliente
            </button>
            <button
              onClick={() => handleMockLogin("ADMIN")}
              disabled={loading}
              className="h-10 text-xs font-bold rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:opacity-90 transition-opacity"
            >
              Simular Admin
            </button>
          </div>
        </div>

        {/* Protection text */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground pt-4 border-t border-border mt-6">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Acceso seguro protegido por Supabase Auth</span>
        </div>
      </div>
    </div>
  );
}
