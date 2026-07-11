import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HelPlis",
  description: "Identificación y contacto mediante QR y NFC.",
  metadataBase: new URL("https://helplis.cl"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f5f5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full bg-neutral-50 text-neutral-950 antialiased">{children}</body>
    </html>
  );
}
