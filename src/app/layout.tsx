import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import { CartProvider } from "@/providers/CartProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import FloatingCart from "@/components/common/FloatingCart";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mango-bike.vercel.app"),
  title: "Mango Bike Store",
  description:
    "Descubre nuestra selecta gama de bicicletas de montaña, ruta y asistencia eléctrica. Equipamiento premium y envíos rápidos en todo el país.",
  keywords: ["bicicletas", "bike store", "mountain bike", "ruta", "specialized", "trek", "giant"],
  authors: [{ name: "Mango Bike" }],
  openGraph: {
    title: "Mango Bike Store | E-Commerce de Bicicletas Premium",
    description: "Descubre nuestra selecta gama de bicicletas de montaña, ruta y asistencia eléctrica. Equipamiento premium y envíos rápidos.",
    url: "https://mango-bike.vercel.app",
    siteName: "Mango Bike Store",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Mango Bike Store Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mango Bike Store | E-Commerce de Bicicletas Premium",
    description: "Descubre nuestra selecta gama de bicicletas de montaña, ruta y asistencia eléctrica. Equipamiento premium y envíos rápidos.",
    images: ["/og-image.png"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storedTheme = localStorage.getItem('mango-theme');
                  var theme = storedTheme || 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                  if (theme === 'dark' || theme === 'forest' || theme === 'cyberpunk' || theme === 'vintage') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <QueryProvider>
            <CartProvider>
              {children}
              <FloatingCart />
            </CartProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
