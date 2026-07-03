import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Syne } from "next/font/google";
import "./globals.css";
import TopNav from "@/components/TopNav";
import BottomNav from "@/components/BottomNav";
import OrbsBackground from "@/components/OrbsBackground";
import SetupBanner from "@/components/SetupBanner";
import VitoButton from "@/components/VitoButton";

// Vito AI non ancora configurato: rimetti a true per riattivare il bottone chat
const VITO_ENABLED = false;

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
  title: "Invintory",
  description: "Gestione stock reselling",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className={`${jakarta.variable} ${syne.variable}`}>
      <body
        style={{
          background: "#050810",
          color: "#F8FAFC",
          fontFamily: "var(--font-jakarta), system-ui, sans-serif",
          minHeight: "100dvh",
        }}
      >
        <OrbsBackground />
        <TopNav />
        <SetupBanner />
        <main style={{ position: "relative", zIndex: 1 }}>{children}</main>
        <BottomNav />
        {VITO_ENABLED && <VitoButton />}
      </body>
    </html>
  );
}
