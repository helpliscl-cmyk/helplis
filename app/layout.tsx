import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "HelPlis",
    template: "%s | HelPlis",
  },
  description:
    "Pulseras y tags con QR y NFC para conectar a quien encuentra con quien puede ayudar, sin GPS propio, bateria ni aplicacion obligatoria.",
  metadataBase: new URL("https://helplis.cl"),
  alternates: {
    canonical: "https://helplis.cl",
  },
  openGraph: {
    title: "HelPlis",
    description:
      "Identificacion simple y actualizable mediante QR y NFC para personas, mascotas y objetos.",
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
    description: "QR y NFC para ayudar a reencontrar personas, mascotas y objetos.",
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
