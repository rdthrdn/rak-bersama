"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import type { BookCard, MemberRole, ReadingStatus } from "@/lib/database.types";
import type { ShelfView } from "@/lib/book-repository";
import { statusText } from "@/lib/book-utils";
import { BookSpine } from "@/components/book-spine";

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
  const reduceMotion = useReducedMotion();

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
        <Link className="wordmark" href="/" aria-label="Rak bersama, beranda">Rak <em>bersama</em></Link>
        <nav className="archive-actions" aria-label="Menu anggota">
          <Link href="/upload" className="text-button">Unggah buku</Link>
          {member.role === "admin" && <Link href="/admin" className="text-button">Undangan</Link>}
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
        <div className="shelf-art-band" aria-hidden="true" />
        <motion.h1 id="shelf-title" initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}>
          Rak <em>bersama</em>
        </motion.h1>
        <p>Buku-buku yang kami simpan, baca, dan terus ceritakan.</p>
      </section>

      <nav className="shelf-tabs" aria-label="Jenis rak">
        <Link className={`shelf-tab${view === "mine" ? " is-active" : ""}`} aria-current={view === "mine" ? "page" : undefined} href={viewHref("mine")}>Rakku</Link>
        <Link className={`shelf-tab${view === "shared" ? " is-active" : ""}`} aria-current={view === "shared" ? "page" : undefined} href={viewHref("shared")}>Rak bersama</Link>
      </nav>

      <section className="shelf-controls" aria-label="Saring buku">
        <label className="select-control">
          <span>Status</span>
          <select value={status} onChange={(event) => changeQuery({ status: event.target.value })} aria-label="Saring berdasarkan status">
            {statuses.map((value) => <option key={value || "all"} value={value}>{value ? statusText(value) : "Semua status"}</option>)}
          </select>
        </label>
        <label className="select-control">
          <span>Bahasa</span>
          <select value={language} onChange={(event) => changeQuery({ language: event.target.value })} aria-label="Saring berdasarkan bahasa">
            <option value="">Semua bahasa</option>
            {languages.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <span className="filter-caption">{view === "mine" ? "Buku milik Anda" : "Metadata yang dibagikan anggota"}</span>
      </section>

      <section className="shelf-display" aria-label="Koleksi buku">
        {books.length > 0 ? (
          <div className="shelf-viewport">
            <div className="shelf-rail">{books.map((book, index) => <BookSpine key={book.id} book={book} index={index} />)}</div>
            <div className="shelf-plank" aria-hidden="true" />
          </div>
        ) : (
          <div className="empty-shelf">
            <p>{collectionTotal === 0 ? (view === "mine" ? "Rak pribadi Anda masih kosong." : "Belum ada buku dalam rak bersama.") : "Belum ada buku dalam pilihan ini."}</p>
            {view === "mine" && collectionTotal === 0 && <Link href="/upload" className="text-button">Tambahkan buku pertama</Link>}
          </div>
        )}
        <footer className="shelf-caption">
          <span>{total} buku{language ? ` · ${language}` : ""}{status ? ` · ${statusText(status).toLowerCase()}` : ""}</span>
          <span className="shelf-hint">Geser untuk melihat rak</span>
        </footer>
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
