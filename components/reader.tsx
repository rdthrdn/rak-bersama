"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import type { Book } from "@/data/books";
import { readerPages } from "@/lib/reader-sample";
import { BookTitle } from "@/components/book-title";
import { SettingsPopover } from "@/components/settings-popover";

export type ReaderTheme = "ink" | "sepia" | "cream";

export function Reader({ book }: { book: Book }) {
  const [page, setPage] = useState(0);
  const [theme, setTheme] = useState<ReaderTheme>("ink");
  const [fontSize, setFontSize] = useState(20);
  const [lineHeight, setLineHeight] = useState(1.7);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  function previousPage() {
    setPage((current) => Math.max(0, current - 1));
  }

  function nextPage() {
    setPage((current) => Math.min(readerPages.length - 1, current + 1));
  }

  useEffect(() => {
    function turnPage(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, select, textarea, [contenteditable=true]")) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previousPage();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        nextPage();
      }
      if (event.key === "Escape") setSettingsOpen(false);
    }

    window.addEventListener("keydown", turnPage);
    return () => window.removeEventListener("keydown", turnPage);
  }, []);

  const readerStyle = {
    "--reader-size": fontSize + "px",
    "--reader-line-height": lineHeight,
  } as CSSProperties;

  return (
    <main className="reader-screen" data-theme={theme} style={readerStyle}>
      <header className="reader-toolbar">
        <Link href={"/books/" + book.id} className="reader-back">
          <span aria-hidden="true">←</span> Kembali ke buku
        </Link>
        <h1 lang={book.language === "Korea" ? "ko" : undefined}>
          <BookTitle book={book} />
        </h1>
        <button
          type="button"
          className="settings-trigger"
          aria-haspopup="dialog"
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen((open) => !open)}
        >
          Aa <span>Tampilan</span>
        </button>
        <SettingsPopover
          open={settingsOpen}
          theme={theme}
          fontSize={fontSize}
          lineHeight={lineHeight}
          onThemeChange={setTheme}
          onFontSizeChange={setFontSize}
          onLineHeightChange={setLineHeight}
        />
      </header>

      <section className="reader-main" aria-label="Teks bacaan">
        <p className="reader-source">Cuplikan publik · The Time Machine, H. G. Wells</p>
        <motion.article
          key={page}
          className="reader-copy"
          aria-live="polite"
          initial={reduceMotion ? false : { opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {readerPages[page].map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </motion.article>
        <p className="page-count">
          Bagian {page + 1} dari {readerPages.length}
        </p>
      </section>

      <nav className="reader-navigation" aria-label="Navigasi halaman">
        <button type="button" className="page-button" onClick={previousPage} disabled={page === 0}>
          ← Sebelumnya
        </button>
        <div className="page-navigation-center">
          <span>{String(page + 1).padStart(2, "0")}</span>
          <span aria-hidden="true"> / </span>
          <span>{String(readerPages.length).padStart(2, "0")}</span>
        </div>
        <button
          type="button"
          className="page-button"
          onClick={nextPage}
          disabled={page === readerPages.length - 1}
        >
          Berikutnya →
        </button>
      </nav>

      <div className="reader-progress" aria-label={"Progres halaman " + Math.round(((page + 1) / readerPages.length) * 100) + "%"}>
        <span style={{ width: ((page + 1) / readerPages.length) * 100 + "%" }} />
      </div>
    </main>
  );
}
