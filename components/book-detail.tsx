"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReadingStatus } from "@/lib/database.types";
import type { BookDetailData } from "@/lib/book-repository";
import { statusText } from "@/lib/book-utils";
import { BookCover } from "@/components/book-cover";
import { BookTitle } from "@/components/book-title";
import { ReviewList } from "@/components/review-list";

const statuses: ReadingStatus[] = ["unread", "reading", "finished", "paused", "dropped"];

export function BookDetail({ data }: { data: BookDetailData }) {
  const router = useRouter();
  const { book } = data;
  const [status, setStatus] = useState(book.status);
  const [savingStatus, setSavingStatus] = useState(false);
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(false);
  const metadata = [book.genre, book.pages ? `${book.pages} hlm` : null, book.year, book.language]
    .filter(Boolean)
    .join("  ·  ");

  async function changeStatus(value: ReadingStatus) {
    setSavingStatus(true);
    setMessage("");
    const response = await fetch(`/api/books/${book.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    });
    if (response.ok) {
      setStatus(value);
      router.refresh();
    } else {
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      setMessage(result.error || "Status belum berubah.");
    }
    setSavingStatus(false);
  }

  async function deleteBook() {
    if (!window.confirm("Hapus buku dan berkas pribadinya dari rak?")) return;
    setDeleting(true);
    setMessage("");
    const response = await fetch(`/api/books/${book.id}`, { method: "DELETE" });
    if (response.ok) {
      router.replace("/");
      router.refresh();
      return;
    }
    const result = (await response.json().catch(() => ({}))) as { error?: string };
    setMessage(result.error || "Buku belum dapat dihapus.");
    setDeleting(false);
  }

  return (
    <main className="detail-page mx-auto w-full">
      <header className="detail-header">
        <Link href="/?view=shared" className="back-link"><span aria-hidden="true">←</span> Kembali ke rak</Link>
        <Link href="/" className="wordmark">Rak <em>bersama</em></Link>
      </header>

      <article className="detail-layout">
        <div className="detail-cover-column"><div className="detail-art-arch" aria-hidden="true" /><BookCover book={book} /></div>
        <div className="detail-content">
          <p className="detail-author">{book.author}{book.owner ? ` · ${book.owner.display_name}` : ""}</p>
          <h1><BookTitle book={book} /></h1>
          {metadata && <p className="metadata-pill">{metadata}</p>}
          <p className="synopsis">{book.synopsis || "Belum ada sinopsis untuk buku ini."}</p>

          <div className="reading-state">
            <div className="reading-state-labels">
              <span>Status membaca</span>
              {book.viewer_is_owner ? (
                <select className="status-editor" aria-label="Ubah status membaca" value={status} disabled={savingStatus} onChange={(event) => void changeStatus(event.target.value as ReadingStatus)}>
                  {statuses.map((value) => <option key={value} value={value}>{statusText(value)}</option>)}
                </select>
              ) : <span>{statusText(book.status)}</span>}
            </div>
            {book.viewer_is_owner ? (
              <>
                <div className="progress-track" role="progressbar" aria-label={`Progres membaca ${book.title}`} aria-valuenow={book.progress} aria-valuemin={0} aria-valuemax={100}>
                  <span style={{ width: `${book.progress}%` }} />
                </div>
                <p className="progress-caption">{Math.round(book.progress)}% selesai</p>
              </>
            ) : <p className="private-progress-note">Progres membaca hanya terlihat oleh pemilik buku.</p>}
          </div>

          {book.viewer_is_owner ? (
            <div className="detail-actions">
              <Link href={`/books/${book.id}/read`} className="read-button">Baca</Link>
              <Link href={`/books/${book.id}/edit`} className="text-button">Ubah metadata</Link>
              <button type="button" className="text-button destructive-button" disabled={deleting} onClick={() => void deleteBook()}>{deleting ? "Menghapus…" : "Hapus buku"}</button>
            </div>
          ) : (
            <div className="reader-unavailable">
              <button className="read-button is-disabled" type="button" disabled>Baca</button>
              <p>Berkas ini hanya dapat dibuka oleh pemiliknya.</p>
            </div>
          )}
          {message && <p className="form-message is-error" role="alert">{message}</p>}

          <section className="member-section" aria-labelledby="shared-title">
            <h2 id="shared-title" className="section-label">Dibaca bersama</h2>
            {data.matchingBooks.length ? (
              <ul className="matching-list">
                {data.matchingBooks.map((entry) => (
                  <li key={entry.id}>
                    <Link href={`/books/${entry.id}`} className="matching-book">
                      <span className="matching-owner member-avatar" aria-hidden="true">{entry.owner?.initials ?? "A"}</span>
                      <span className="matching-copy"><strong>{entry.owner?.display_name ?? "Anggota"}</strong><span>{statusText(entry.status)} · {entry.title}</span></span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="empty-inline">Belum ada anggota lain dengan judul dan penulis yang sama.</p>}
          </section>
        </div>
      </article>

      <section className="review-section" aria-labelledby="reviews-title">
        <h2 id="reviews-title">Catatan <em>anggota</em></h2>
        <ReviewList bookId={book.id} reviews={data.reviews} />
      </section>
    </main>
  );
}

export function BookDetailError() {
  return <main className="detail-page"><p className="state-message" role="alert">Detail buku belum dapat dimuat.</p><Link href="/" className="text-button">Kembali ke rak</Link></main>;
}
