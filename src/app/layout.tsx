import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import { CartProvider } from "@/providers/CartProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Veloce | Premium Bike Store & E-Commerce",
  description:
    "Descubre nuestra selecta gama de bicicletas de montaña, ruta y asistencia eléctrica. Equipamiento premium y envíos rápidos en todo el país.",
  keywords: ["bicicletas", "bike store", "mountain bike", "ruta", "specialized", "trek", "giant"],
  authors: [{ name: "Veloce Team" }],
  openGraph: {
    title: "Veloce | E-Commerce de Bicicletas Premium",
    description: "Encuentra bicicletas de alta gama y componentes Specialized, Trek y Giant.",
    url: "https://veloce-bikes.com",
    siteName: "Veloce",
    locale: "es_AR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <QueryProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
