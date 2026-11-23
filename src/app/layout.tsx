import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SmoothScroll from "@/components/providers/SmoothScroll";
import { StoreProvider } from "@/lib/store";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Overlays from "@/components/layout/Overlays";
import { BRAND } from "@/lib/brand";

// Same typefaces as Coco-cola-web: Anton for headlines, Archivo (variable 100–900) for everything else.
const anton = localFont({
  src: "./fonts/anton.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-anton",
  adjustFontFallback: false,
});

const archivo = localFont({
  src: "./fonts/archivo.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-archivo",
  adjustFontFallback: false,
});

// hand-lettered marker, only for the "Good vibes only" tag in the Originals section
const marker = localFont({
  src: "./fonts/permanent-marker.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-marker-src",
});

export const metadata: Metadata = {
  title: { default: `${BRAND.name} — Menswear, considered`, template: `%s · ${BRAND.name}` },
  description: BRAND.description,
};

export const viewport: Viewport = { themeColor: "#E6D5BD", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${archivo.variable} ${marker.variable}`}>
      <body>
        <StoreProvider>
          <SmoothScroll>
            <Navbar />
            <main id="main">{children}</main>
            <Footer />
            <Overlays />
          </SmoothScroll>
        </StoreProvider>
      </body>
    </html>
  );
}
