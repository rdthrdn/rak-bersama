import { KlimtLoading } from "@/components/klimt-loading";

export default function ShelfLoading() {
  return (
    <main className="shelf-page mx-auto w-full" aria-busy="true" aria-label="Memuat rak">
      <header className="archive-header">
        <span className="wordmark">
          <svg className="wordmark-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 21V11M12 11C12 7.5 9.5 4 5 4c0 4.5 3.5 7 7 7zm0 0c0-3.5 2.5-7 7-7 0 4.5-3.5 7-7 7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="11" r="1.5" fill="currentColor" />
          </svg>
          <span className="wordmark-text">Rak bersama</span>
        </span>
      </header>
      <section className="loading-shelf">
        <KlimtLoading message="Menata rak buku…" submessage="Mengambil arsip dan koleksi baca..." />
      </section>
    </main>
  );
}
