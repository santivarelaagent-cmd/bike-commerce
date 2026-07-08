import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card text-card-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src="/mango.svg" alt="Mango Bike" className="w-6 h-6 object-contain" />
              <span className="text-lg font-black tracking-tighter text-primary">MANGO BIKE</span>
            </div>
            <p className="text-sm text-muted-foreground">
              La bicicletería premium preferida por profesionales y entusiastas. Elevamos tu experiencia sobre ruedas.
            </p>
          </div>

          {/* Catalog links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Catálogo</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/products?category=mountain-bikes" className="hover:text-primary">
                  Mountain Bikes
                </Link>
              </li>
              <li>
                <Link href="/products?category=road-bikes" className="hover:text-primary">
                  Road Bikes
                </Link>
              </li>
              <li>
                <Link href="/products?category=electric-bikes" className="hover:text-primary">
                  Electric Bikes
                </Link>
              </li>
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Compañía</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-primary">
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/stores" className="hover:text-primary">
                  Sucursales
                </Link>
              </li>
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Soporte</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/shipping" className="hover:text-primary">
                  Envíos y Entregas
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-primary">
                  Devoluciones
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary">
                  Términos y Condiciones
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Mango Bike S.A. Todos los derechos reservados.
          </p>
          <div className="flex space-x-6 text-xs text-muted-foreground">
            <span className="hover:text-primary cursor-pointer">Mercado Pago Verificado</span>
            <span className="hover:text-primary cursor-pointer">Mercado Libre Partner</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
