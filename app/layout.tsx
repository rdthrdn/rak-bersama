import type { Metadata } from "next";
import { MotionShell } from "@/components/motion-shell";
import { ArtCreditsFooter } from "@/components/art-credits-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rak bersama — Arsip baca pribadi",
  description: "Arsip buku pribadi untuk kelompok baca melalui undangan.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" data-theme="ink" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("rak_theme")||"ink";document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <MotionShell>{children}</MotionShell>
        <ArtCreditsFooter />
      </body>
    </html>
  );
}
