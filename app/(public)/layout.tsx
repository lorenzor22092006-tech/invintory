import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Syne } from "next/font/google";
import "../globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rubinos Sellers",
  description: "I nostri articoli",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className={`${jakarta.variable} ${syne.variable}`}>
      <body
        style={{
          background: "#000000",
          color: "#F8FAFC",
          fontFamily: "var(--font-jakarta), system-ui, sans-serif",
          minHeight: "100dvh",
          overflow: "hidden",
        }}
      >
        {children}
      </body>
    </html>
  );
}
