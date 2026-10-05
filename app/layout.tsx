import type { Metadata } from "next";
import { Cormorant_Garamond, Newsreader } from "next/font/google";
import { MotionShell } from "@/components/motion-shell";
import { ArtCreditsFooter } from "@/components/art-credits-footer";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-cormorant",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  title: "Rak bersama — Arsip baca pribadi",
  description: "Arsip buku pribadi untuk kelompok baca melalui undangan.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={cormorant.variable + " " + newsreader.variable}>
        <MotionShell>{children}</MotionShell>
        <ArtCreditsFooter />
      </body>
    </html>
  );
}
