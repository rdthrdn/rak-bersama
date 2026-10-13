"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Reorder, motion, useReducedMotion } from "framer-motion";
import type { BookCard, MemberRole, ReadingStatus } from "@/lib/database.types";
import type { ShelfView } from "@/lib/book-repository";
import { statusText } from "@/lib/book-utils";
import { BookSpine } from "@/components/book-spine";
import { ThemeToggle } from "@/components/theme-toggle";

const statuses: Array<ReadingStatus | ""> = ["", "reading", "finished", "dropped", "paused", "unread"];

export function Shelf({
  books,
  languages,
  total,
  collectionTotal,
  view,
  status,
  language,
  member,
}: {
  books: BookCard[];
  languages: string[];
  total: number;
  collectionTotal: number;
  view: ShelfView;
  status: ReadingStatus | "";
  language: string;
  member: { display_name: string; initials: string; role: MemberRole };
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [orderedBooks, setOrderedBooks] = useState<BookCard[]>(books);
  const [isCustomOrder, setIsCustomOrder] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(`rak_order_${view}`);
      if (saved) {
        const ids = JSON.parse(saved) as string[];
        if (Array.isArray(ids) && ids.length > 0) {
          const map = new Map(books.map((b) => [b.id, b]));
          const sorted: BookCard[] = [];
          for (const id of ids) {
            const item = map.get(id);
            if (item) {
              sorted.push(item);
              map.delete(id);
            }
          }
          for (const remaining of map.values()) {
            sorted.push(remaining);
          }
          if (sorted.length > 0) {
            setOrderedBooks(sorted);
            setIsCustomOrder(true);
            return;
          }
        }
      }
    } catch {
      // Ignore localStorage issues
    }
    setOrderedBooks(books);
    setIsCustomOrder(false);
  }, [books, view]);

  function handleReorder(newOrder: BookCard[]) {
    setOrderedBooks(newOrder);
    setIsCustomOrder(true);
    try {
      window.localStorage.setItem(`rak_order_${view}`, JSON.stringify(newOrder.map((b) => b.id)));
    } catch {
      // Ignore
    }
  }

  function handleResetOrder() {
    setOrderedBooks(books);
    setIsCustomOrder(false);
    try {
      window.localStorage.removeItem(`rak_order_${view}`);
    } catch {
      // Ignore
    }
  }
  function changeQuery(values: Record<string, string>) {
    const query = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(values)) {
      if (value) query.set(key, value);
      else query.delete(key);
    }
    const suffix = query.toString();
    router.replace(`${window.location.pathname}${suffix ? `?${suffix}` : ""}`, { scroll: false });
  }

  function viewHref(nextView: ShelfView) {
    const query = new URLSearchParams();
    query.set("view", nextView);
    if (status) query.set("status", status);
    if (language) query.set("language", language);
    return `/?${query.toString()}`;
  }

  return (
    <main className="shelf-page mx-auto w-full">
      <header className="archive-header">
        <Link className="wordmark" href="/" aria-label="Rak bersama, beranda">
          <svg className="wordmark-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 21V11M12 11C12 7.5 9.5 4 5 4c0 4.5 3.5 7 7 7zm0 0c0-3.5 2.5-7 7-7 0 4.5-3.5 7-7 7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="11" r="1.5" fill="currentColor" />
            <path d="M12 17c-2.5-1.5-4-3-4-5M12 17c2.5-1.5 4-3 4-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.8" />
          </svg>
          <span className="wordmark-text">Rak bersama</span>
        </Link>
        <nav className="archive-actions" aria-label="Menu anggota">
          <Link href={viewHref("shared")} className={`nav-link${view === "shared" ? " is-active" : ""}`}>Rak</Link>
          <Link href="/upload" className="nav-link">Unggah</Link>
          {member.role === "admin" && <Link href="/admin" className="nav-link">Undangan</Link>}
          <ThemeToggle />
          <button type="button" className="member-avatar" title={member.display_name} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>{member.initials}</button>
          {menuOpen && (
            <form className="member-menu" action="/auth/signout" method="post">
              <span>{member.display_name}</span>
              <button className="text-button" type="submit">Keluar</button>
            </form>
          )}
        </nav>
      </header>

      <section className="shelf-hero" aria-labelledby="shelf-title">
        <div className="shelf-tree-bg" aria-hidden="true" />
        <div className="shelf-hero-left">
          <motion.h1 id="shelf-title" initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}>
            Rak bersama
          </motion.h1>

          <section className="shelf-controls" aria-label="Saring buku">
            <label className="select-control">
              <span className="control-label">Status</span>
              <div className="select-box">
                <select value={status} onChange={(event) => changeQuery({ status: event.target.value })} aria-label="Saring berdasarkan status">
                  {statuses.map((value) => <option key={value || "all"} value={value}>{value ? statusText(value) : "Semua status"}</option>)}
                </select>
                <span className="select-caret" aria-hidden="true">⌄</span>
              </div>
            </label>
            <label className="select-control">
              <span className="control-label">Bahasa</span>
              <div className="select-box">
                <select value={language} onChange={(event) => changeQuery({ language: event.target.value })} aria-label="Saring berdasarkan bahasa">
                  <option value="">Semua bahasa</option>
                  {languages.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
                <span className="select-caret" aria-hidden="true">⌄</span>
              </div>
            </label>
          </section>
        </div>
      </section>

      <section className="shelf-display" aria-label="Koleksi buku">
        {books.length > 0 ? (
          <div className="shelf-stage">
            <div className="shelf-wall-spotlight" aria-hidden="true" />
            <div className="shelf-viewport">
              <Reorder.Group
                as="div"
                axis="x"
                values={orderedBooks}
                onReorder={handleReorder}
                className="shelf-rail"
                layoutScroll
              >
                {orderedBooks.map((book, index) => (
                  <BookSpine key={book.id} book={book} index={index} />
                ))}
              </Reorder.Group>
            </div>
            <div className="shelf-woodwork" aria-hidden="true">
              <div className="shelf-plank-top" />
              <div className="shelf-plank-face" />
              <div className="shelf-bracket shelf-bracket-left">
                <svg viewBox="0 0 46 54" fill="none" className="bracket-svg">
                  <path d="M0 0h46v12c-4 18-20 38-46 42V0z" fill="url(#bracket-wood-l)" />
                  <path d="M12 12c4 10 14 20 28 26" stroke="#D0BD93" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.75" />
                  <path d="M22 18c3 5 8 10 14 13" stroke="#D0BD93" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.6" />
                  <circle cx="28" cy="24" r="2" fill="#D0BD93" fillOpacity="0.8" />
                  <defs>
                    <linearGradient id="bracket-wood-l" x1="0" y1="0" x2="46" y2="54" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#3E3125" />
                      <stop offset="1" stopColor="#221A13" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="shelf-bracket shelf-bracket-right">
                <svg viewBox="0 0 46 54" fill="none" className="bracket-svg">
                  <path d="M46 0H0v12c4 18 20 38 46 42V0z" fill="url(#bracket-wood-r)" />
                  <path d="M34 12c-4 10-14 20-28 26" stroke="#D0BD93" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.75" />
                  <path d="M24 18c-3 5-8 10-14 13" stroke="#D0BD93" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.6" />
                  <circle cx="18" cy="24" r="2" fill="#D0BD93" fillOpacity="0.8" />
                  <defs>
                    <linearGradient id="bracket-wood-r" x1="46" y1="0" x2="0" y2="54" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#3E3125" />
                      <stop offset="1" stopColor="#221A13" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <footer className="shelf-bottom-caption">
              <div className="shelf-caption-main">
                <span>{total} buku di {view === "shared" ? "rak bersama" : "rak pribadi"}</span>
                <span className="shelf-reorder-hint">✦ Tahan & geser buku untuk menata rak</span>
                {isCustomOrder && (
                  <button type="button" className="shelf-reset-btn" onClick={handleResetOrder}>
                    Reset susunan
                  </button>
                )}
              </div>
            </footer>
          </div>
        ) : (
          <div className="empty-shelf">
            <p>{collectionTotal === 0 ? (view === "mine" ? "Rak pribadi Anda masih kosong." : "Belum ada buku dalam rak bersama.") : "Belum ada buku dalam pilihan ini."}</p>
            {view === "mine" && collectionTotal === 0 && <Link href="/upload" className="text-button">Tambahkan buku pertama</Link>}
          </div>
        )}
      </section>
    </main>
  );
}

export function ShelfError({ member }: { member: { initials: string; display_name: string; role: MemberRole } }) {
  return (
    <main className="shelf-page mx-auto w-full">
      <header className="archive-header"><Link className="wordmark" href="/">Rak <em>bersama</em></Link><span className="member-avatar" title={member.display_name}>{member.initials}</span></header>
      <section className="error-shelf"><h1>Rak belum <em>terbuka</em></h1><p>Data buku belum dapat dimuat. Periksa sambungan Supabase, lalu coba lagi.</p><Link href="/" className="text-button">Coba lagi</Link></section>
    </main>
  );
}
