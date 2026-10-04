export default function ShelfLoading() {
  return (
    <main className="shelf-page mx-auto w-full" aria-busy="true" aria-label="Memuat rak">
      <header className="archive-header"><span className="wordmark">Rak <em>bersama</em></span></header>
      <section className="loading-shelf"><span className="loading-rule" /><p>Rak sedang dibuka</p></section>
    </main>
  );
}
