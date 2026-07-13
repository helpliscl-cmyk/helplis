import type { Metadata, Viewport } from "next";
import "./globals.css";
import { HOME_SEO } from "@/lib/marketing/content";

export const metadata: Metadata = {
  title: {
    default: "HelPlis",
    template: "%s | HelPlis",
  },
  description: HOME_SEO.description,
  metadataBase: new URL("https://helplis.cl"),
  alternates: {
    canonical: "https://helplis.cl",
  },
  openGraph: {
    title: "HelPlis",
    description: HOME_SEO.description,
    url: "https://helplis.cl",
    siteName: "HelPlis",
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: "/brand/optimized/helplis-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Pulsera HelPlis con QR y NFC",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HelPlis",
    description: HOME_SEO.description,
    images: ["/brand/optimized/helplis-og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/brand/optimized/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/optimized/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/brand/optimized/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b3774",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full bg-[var(--brand-background)] text-[var(--brand-text)] antialiased">{children}</body>
    </html>
  );
}
