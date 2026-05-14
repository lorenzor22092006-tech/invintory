import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import VitoButton from "@/components/VitoButton";

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
    <html lang="it">
      <body className="bg-[#061311] text-white min-h-screen">
        <main className="pb-24">
          {children}
        </main>
        <BottomNav />
        <VitoButton />
      </body>
    </html>
  );
}