import Link from "next/link";
import type { Book } from "@/data/books";
import { BookCover } from "@/components/book-cover";
import { BookTitle } from "@/components/book-title";
import { displayTitle, statusText } from "@/lib/book-utils";

export function BookDetail({ book }: { book: Book }) {
  const metadata = [book.genre, book.pages ? book.pages + " hlm" : null, String(book.year)]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <main className="detail-page mx-auto w-full">
      <header className="detail-header">
        <Link href="/" className="back-link">
          <span aria-hidden="true">←</span> Kembali ke rak
        </Link>
        <span className="wordmark">Rak bersama</span>
      </header>

      <div className="page-indicator" role="progressbar" aria-label={"Progres membaca " + displayTitle(book)} aria-valuenow={book.progress} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ height: book.progress + "%" }} />
      </div>

      <article className="detail-layout">
        <div className="detail-cover-column">
          <BookCover book={book} />
        </div>
        <div className="detail-content">
          <p className="detail-author">{book.author}</p>
          <h1 lang={book.language === "Korea" ? "ko" : undefined}>
            <BookTitle book={book} />
          </h1>
          <p className="metadata-pill">{metadata}</p>
          <p className="synopsis">{book.synopsis}</p>

          <div className="reading-state">
            <div className="reading-state-labels">
              <span>Status membaca</span>
              <span>{statusText(book.status)}</span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label={"Progres membaca " + displayTitle(book)}
              aria-valuenow={book.progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: book.progress + "%" }} />
            </div>
          </div>

          <Link href={"/books/" + book.id + "/read"} className="read-button">
            Baca
          </Link>

          <section className="member-section" aria-label="Teman yang membaca buku ini">
            <p className="section-label">Dibaca bersama</p>
            <div className="member-list">
              {book.members.map((member) => (
                <span className="member-avatar" key={member} aria-label={"Anggota " + member} title={"Anggota " + member}>
                  {member}
                </span>
              ))}
            </div>
          </section>
        </div>
      </article>
    </main>
  );
}
