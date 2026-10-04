"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { books, statusLabels, type BookLanguage, type ReadingStatus } from "@/data/books";
import { BookSpine } from "@/components/book-spine";

type StatusFilter = "All" | ReadingStatus;
type LanguageFilter = "All" | BookLanguage;

const statuses: StatusFilter[] = ["All", "Finished", "Reading", "Dropped", "Paused"];

export function Shelf() {
  const [status, setStatus] = useState<StatusFilter>("All");
  const [language, setLanguage] = useState<LanguageFilter>("All");
  const reduceMotion = useReducedMotion();
  const visibleBooks = useMemo(
    () =>
      books.filter(
        (book) =>
          (status === "All" || book.status === status) &&
          (language === "All" || book.language === language),
      ),
    [status, language],
  );

  return (
    <main className="shelf-page mx-auto w-full">
      <header className="archive-header">
        <Link className="wordmark" href="/" aria-label="Rak bersama, beranda">
          Rak bersama
        </Link>
        <span className="header-note">Arsip baca bersama</span>
      </header>

      <section className="shelf-intro" aria-labelledby="shelf-title">
        <motion.h1
          id="shelf-title"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          Rak <em>bersama</em>
        </motion.h1>
        <p>Buku yang kami simpan, baca, dan terus ceritakan.</p>
      </section>

      <section className="shelf-controls" aria-label="Saring buku">
        <div className="status-filters" role="group" aria-label="Status membaca">
          {statuses.map((value) => (
            <button
              key={value}
              type="button"
              className={"filter-button" + (status === value ? " is-active" : "")}
              aria-pressed={status === value}
              onClick={() => setStatus(value)}
            >
              {statusLabels[value]}
            </button>
          ))}
        </div>
        <label className="language-control">
          <span>Bahasa</span>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as LanguageFilter)}
            aria-label="Saring berdasarkan bahasa"
          >
            <option value="All">Semua bahasa</option>
            <option value="Inggris">Inggris</option>
            <option value="Indonesia">Indonesia</option>
            <option value="Korea">Korea</option>
          </select>
        </label>
      </section>

      <section className="shelf-display" aria-label="Koleksi buku">
        {visibleBooks.length > 0 ? (
          <div className="shelf-viewport">
            <div className="shelf-rail">
              {visibleBooks.map((book, index) => (
                <BookSpine key={book.id} book={book} index={index} />
              ))}
            </div>
          </div>
        ) : (
          <p className="empty-shelf">Belum ada buku dalam pilihan ini.</p>
        )}
        <p className="shelf-caption">
          <span>{visibleBooks.length} buku · {status === "All" ? "seluruh koleksi" : statusLabels[status].toLowerCase()}</span>
          <span className="shelf-hint">Geser untuk melihat rak</span>
        </p>
      </section>

    </main>
  );
}
