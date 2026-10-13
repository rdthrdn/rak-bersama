"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties, TouchEvent } from "react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import type { Book as EpubBook, Rendition as EpubRendition } from "epubjs";
import type { BookRow, ReadingStatus } from "@/lib/database.types";
import { BookTitle } from "@/components/book-title";
import { SettingsPopover } from "@/components/settings-popover";

export type ReaderTheme = "ink" | "sepia" | "cream";
type ReaderBook = Pick<BookRow, "id" | "title" | "author" | "language" | "pages" | "status" | "format">;
type ReaderLocator =
  | { format: "epub"; cfi: string }
  | { format: "pdf"; page: number; totalPages: number };
type NavigationItem = { label: string; href: string; subitems?: NavigationItem[] };
const themeColors: Record<ReaderTheme, { background: string; foreground: string }> = {
  ink: { background: "#2A2924", foreground: "#ECE9E2" },
  sepia: { background: "#352D25", foreground: "#EFE2CC" },
  cream: { background: "#ECE9E2", foreground: "#2A2924" },
};

function locatorFor(format: ReaderBook["format"], locator: Record<string, unknown> | null): ReaderLocator | null {
  if (!locator || locator.format !== format) return null;
  if (format === "epub" && typeof locator.cfi === "string" && locator.cfi.startsWith("epubcfi(")) {
    return { format: "epub", cfi: locator.cfi };
  }
  if (format === "pdf" && Number.isInteger(locator.page) && Number.isInteger(locator.totalPages)) {
    return { format: "pdf", page: Number(locator.page), totalPages: Number(locator.totalPages) };
  }
  return null;
}

function flattenToc(items: NavigationItem[], depth = 0): Array<NavigationItem & { depth: number }> {
  return items.flatMap((item) => [
    { label: item.label, href: item.href, depth },
    ...flattenToc(item.subitems ?? [], depth + 1),
  ]);
}

export function Reader({
  book,
  initialLocator,
  initialPercent,
}: {
  book: ReaderBook;
  initialLocator: Record<string, unknown> | null;
  initialPercent: number;
}) {
  const router = useRouter();
  const mountRef = useRef<HTMLDivElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const resizeTargetRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<EpubRendition | null>(null);
  const epubBookRef = useRef<EpubBook | null>(null);
  const pdfTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const pdfDocumentRef = useRef<PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const pagesRef = useRef(0);
  const touchStartRef = useRef<number | null>(null);
  const frameCleanupRef = useRef<Array<() => void>>([]);
  const completionShownRef = useRef(false);
  const initialPosition = useMemo(() => locatorFor(book.format, initialLocator), [book.format, initialLocator]);

  const [theme, setTheme] = useState<ReaderTheme>("ink");
  const [fontSize, setFontSize] = useState(20);
  const [lineHeight, setLineHeight] = useState(1.7);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [toc, setToc] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [problem, setProblem] = useState("");
  const [savingLabel, setSavingLabel] = useState("");
  const [locator, setLocator] = useState<ReaderLocator | null>(initialPosition);
  const [percent, setPercent] = useState(initialPercent);
  const [page, setPage] = useState(initialPosition?.format === "pdf" ? initialPosition.page : 1);
  const [pages, setPages] = useState(initialPosition?.format === "pdf" ? initialPosition.totalPages : 0);
  const [zoom, setZoom] = useState(1);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [finishPrompt, setFinishPrompt] = useState(false);

  useEffect(() => { pagesRef.current = pages; }, [pages]);

  const percentLabel = Math.max(0, Math.min(100, Math.round(percent)));

  const nextPage = useCallback(() => {
    if (book.format === "epub") void renditionRef.current?.next();
    else setPage((current) => Math.min(pagesRef.current, current + 1));
  }, [book.format]);

  const previousPage = useCallback(() => {
    if (book.format === "epub") void renditionRef.current?.prev();
    else setPage((current) => Math.max(1, current - 1));
  }, [book.format]);

  const handleTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    touchStartRef.current = event.touches[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback((event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    const end = event.changedTouches[0]?.clientX;
    touchStartRef.current = null;
    if (start === null || end === undefined || Math.abs(end - start) < 54) return;
    if (end < start) nextPage();
    else previousPage();
  }, [nextPage, previousPage]);

  useEffect(() => {
    const target = resizeTargetRef.current;
    if (!target) return;
    const observer = new ResizeObserver((entries) => setAvailableWidth(Math.floor(entries[0]?.contentRect.width ?? 0)));
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let disposed = false;
    let rendition: EpubRendition | null = null;
    let epubBook: EpubBook | null = null;
    let pdfTask: PDFDocumentLoadingTask | null = null;

    async function loadBook() {
      setLoading(true);
      setProblem("");
      setReady(false);
      try {
        const response = await fetch(`/api/books/${book.id}/file-url`, { cache: "no-store" });
        const signed = (await response.json().catch(() => ({}))) as { url?: string; format?: string; error?: string };
        if (!response.ok || !signed.url || signed.format !== book.format) throw new Error(signed.error || "Berkas baca belum tersedia.");
        if (disposed) return;

        if (book.format === "epub") {
          const epubModule = await import("epubjs");
          const makeBook = epubModule.default;
          const loadedBook = makeBook(signed.url, { openAs: "epub" });
          epubBook = loadedBook;
          epubBookRef.current = loadedBook;
          await loadedBook.ready;
          const nav = await loadedBook.loaded.navigation;
          if (disposed || !mountRef.current) return;
          setToc((nav.toc ?? []) as NavigationItem[]);
          const builtRendition = loadedBook.renderTo(mountRef.current, {
            width: "100%",
            height: "100%",
            flow: "paginated",
            spread: "none",
            allowScriptedContent: false,
          });
          rendition = builtRendition;
          renditionRef.current = builtRendition;

          const removeFrameGestures = () => {
            for (const cleanup of frameCleanupRef.current) cleanup();
            frameCleanupRef.current = [];
            const frames = mountRef.current?.querySelectorAll("iframe") ?? [];
            frames.forEach((frame) => {
              frame.setAttribute("sandbox", "allow-same-origin");
              const document = frame.contentDocument;
              if (!document) return;
              const start = (event: Event) => {
                const touch = (event as Event & { touches: globalThis.TouchList }).touches[0];
                touchStartRef.current = touch?.clientX ?? null;
              };
              const end = (event: Event) => {
                const touch = (event as Event & { changedTouches: globalThis.TouchList }).changedTouches[0];
                const startX = touchStartRef.current;
                touchStartRef.current = null;
                if (startX === null || !touch || Math.abs(touch.clientX - startX) < 54) return;
                if (touch.clientX < startX) nextPage();
                else previousPage();
              };
              document.addEventListener("touchstart", start, { passive: true });
              document.addEventListener("touchend", end, { passive: true });
              frameCleanupRef.current.push(() => {
                document.removeEventListener("touchstart", start);
                document.removeEventListener("touchend", end);
              });
            });
          };

          builtRendition.on("rendered", () => removeFrameGestures());
          builtRendition.on("relocated", (event: unknown) => {
            const location = event as { start?: { cfi?: string; displayed?: { page?: number; total?: number } } } | undefined;
            const cfi = location?.start?.cfi;
            if (!cfi || !loadedBook.locations.length()) return;
            const nextPercent = loadedBook.locations.percentageFromCfi(cfi) * 100;
            setPercent(nextPercent);
            setLocator({ format: "epub", cfi });
            setPage(location?.start?.displayed?.page ?? 1);
            setPages(location?.start?.displayed?.total ?? 0);
          });
          await loadedBook.locations.generate(1200);
          await builtRendition.display(initialPosition?.format === "epub" ? initialPosition.cfi : undefined);
          removeFrameGestures();
          if (!disposed) setReady(true);
        } else {
          const pdfjs = await import("pdfjs-dist");
          pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
          const task = pdfjs.getDocument({ url: signed.url });
          pdfTask = task;
          pdfTaskRef.current = task;
          const document = await task.promise;
          if (disposed) return;
          pdfDocumentRef.current = document;
          setPages(document.numPages);
          const saved = initialPosition?.format === "pdf" ? initialPosition.page : 1;
          setPage(Math.min(Math.max(1, saved), document.numPages));
          setReady(true);
        }
      } catch (error) {
        if (!disposed) setProblem(error instanceof Error ? error.message : "Buku belum dapat dibuka.");
      } finally {
        if (!disposed) setLoading(false);
      }
    }

    void loadBook();
    return () => {
      disposed = true;
      for (const cleanup of frameCleanupRef.current) cleanup();
      frameCleanupRef.current = [];
      rendition?.destroy();
      epubBook?.destroy();
      void pdfTask?.destroy();
      renditionRef.current = null;
      epubBookRef.current = null;
      pdfTaskRef.current = null;
      pdfDocumentRef.current = null;
    };
  }, [book.id, book.format, initialPosition, nextPage, previousPage]);

  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition || book.format !== "epub") return;
    rendition.themes.register(theme, {
      body: { background: themeColors[theme].background, color: themeColors[theme].foreground },
      "a, a:link, a:visited, a:hover, a:active": { color: themeColors[theme].foreground },
    });
    rendition.themes.select(theme);
    rendition.themes.fontSize(`${fontSize}px`);
    rendition.themes.override("line-height", String(lineHeight), true);
    const fontName = window.getComputedStyle(document.body).getPropertyValue("--font-newsreader").trim();
    rendition.themes.override("font-family", `${fontName || "Georgia"}, serif`, true);
  }, [book.format, fontSize, lineHeight, theme, ready]);

  useEffect(() => {
    const document = pdfDocumentRef.current;
    const canvas = pdfCanvasRef.current;
    if (book.format !== "pdf" || !document || !canvas || !ready || !availableWidth) return;
    let cancelled = false;
    const renderPage = async () => {
      try {
        renderTaskRef.current?.cancel();
        const pageProxy = await document.getPage(page);
        const base = pageProxy.getViewport({ scale: 1 });
        const scale = Math.max(0.45, Math.min(3, ((availableWidth - 36) / base.width) * zoom));
        const viewport = pageProxy.getViewport({ scale });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const task = pageProxy.render({ canvas, viewport });
        renderTaskRef.current = task;
        await task.promise;
        if (cancelled) return;
        const nextPercent = (page / document.numPages) * 100;
        setPercent(nextPercent);
        setLocator({ format: "pdf", page, totalPages: document.numPages });
      } catch (error) {
        if (!cancelled && !(error instanceof Error && error.name === "RenderingCancelledException")) {
          setProblem("Halaman PDF belum dapat dirender.");
        }
      }
    };
    void renderPage();
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [availableWidth, book.format, page, ready, zoom]);

  const savedSignatureRef = useRef(JSON.stringify({ locator: initialPosition, percent: initialPercent }));
  useEffect(() => {
    if (!ready || !locator) return;
    const payload = { locator, percent: Math.round(percent * 100) / 100 };
    const signature = JSON.stringify(payload);
    if (signature === savedSignatureRef.current) return;
    setSavingLabel("Belum tersimpan");
    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/books/${book.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: signature,
      }).catch(() => null);
      if (response?.ok) {
        savedSignatureRef.current = signature;
        setSavingLabel("Tersimpan");
      } else {
        setSavingLabel("Progres belum tersimpan");
      }
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [book.id, locator, percent, ready]);

  useEffect(() => {
    if (!ready || percent < 98 || book.status === "finished" || completionShownRef.current) return;
    completionShownRef.current = true;
    setFinishPrompt(true);
  }, [book.status, percent, ready]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, select, textarea, [contenteditable=true]")) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previousPage();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        nextPage();
      } else if (event.key === "Escape") {
        setSettingsOpen(false);
        setTocOpen(false);
        setFinishPrompt(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nextPage, previousPage]);

  const readerStyle = {
    "--reader-size": `${fontSize}px`,
    "--reader-line-height": lineHeight,
  } as CSSProperties;

  async function markFinished() {
    const response = await fetch(`/api/books/${book.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "finished" satisfies ReadingStatus }),
    });
    if (response.ok) {
      setFinishPrompt(false);
      router.refresh();
    } else {
      setProblem("Status selesai belum tersimpan.");
    }
  }

  function openToc(item: NavigationItem) {
    void renditionRef.current?.display(item.href);
    setTocOpen(false);
  }

  return (
    <main className="reader-screen" data-theme={theme} style={readerStyle}>
      <header className="reader-toolbar">
        <Link href={`/books/${book.id}`} className="reader-back"><span aria-hidden="true">←</span> Kembali ke buku</Link>
        <h1><BookTitle book={book} /></h1>
        <div className="reader-tools">
          {book.format === "epub" && <button type="button" className="reader-tool" aria-expanded={tocOpen} onClick={() => setTocOpen((open) => !open)}>Daftar isi</button>}
          <button type="button" className="settings-trigger" aria-haspopup="dialog" aria-expanded={settingsOpen} onClick={() => setSettingsOpen((open) => !open)}>Aa <span>Tampilan</span></button>
        </div>
        <SettingsPopover
          open={settingsOpen}
          theme={theme}
          fontSize={fontSize}
          lineHeight={lineHeight}
          typographyEnabled={book.format === "epub"}
          onThemeChange={setTheme}
          onFontSizeChange={setFontSize}
          onLineHeightChange={setLineHeight}
        />
      </header>

      {tocOpen && book.format === "epub" && (
        <>
          <button className="toc-backdrop" type="button" aria-label="Tutup daftar isi" onClick={() => setTocOpen(false)} />
          <aside className="toc-drawer" role="dialog" aria-label="Daftar isi buku">
            <div className="toc-heading"><h2>Daftar <em>isi</em></h2><button className="text-button" type="button" onClick={() => setTocOpen(false)}>Tutup</button></div>
            <nav aria-label="Bab buku"><ol>{flattenToc(toc).map((item, index) => <li key={`${item.href}-${index}`} style={{ paddingInlineStart: `${item.depth * 14}px` }}><button type="button" onClick={() => openToc(item)}>{item.label}</button></li>)}</ol></nav>
            {!toc.length && <p className="empty-inline">Daftar isi tidak tersedia pada EPUB ini.</p>}
          </aside>
        </>
      )}

      <section className="reader-main" aria-label={`Teks buku ${book.title}`}>
        <div className="reader-source-row"><p className="reader-source">{book.format.toUpperCase()} · {book.author}</p><span className="reader-save-state" role="status">{savingLabel}</span></div>
        {loading && <p className="reader-loading" role="status">Membuka buku…</p>}
        {problem && <p className="form-message is-error" role="alert">{problem}</p>}
        <div ref={resizeTargetRef} className="reader-stage" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {book.format === "epub" ? (
            <div ref={mountRef} className="epub-mount" aria-label="Halaman EPUB" />
          ) : (
            <div className="pdf-page-wrap"><canvas ref={pdfCanvasRef} className="pdf-canvas" aria-label={`Halaman ${page} dari ${pages}`} /></div>
          )}
        </div>
      </section>

      <nav className="reader-navigation" aria-label="Navigasi halaman">
        <button type="button" className="page-button" onClick={previousPage} disabled={loading || (book.format === "pdf" && page <= 1)}><span aria-hidden="true">←</span> Sebelumnya</button>
        <div className="page-navigation-center">
          {book.format === "pdf" ? <><span>{page}</span><span aria-hidden="true"> / </span><span>{pages || "—"}</span></> : <span>{percentLabel}%</span>}
        </div>
        {book.format === "pdf" && <div className="pdf-zoom-controls"><button type="button" aria-label="Perkecil halaman" onClick={() => setZoom((value) => Math.max(0.5, Math.round((value - 0.15) * 100) / 100))}>−</button><button type="button" aria-label="Sesuaikan lebar" onClick={() => setZoom(1)}>Pas lebar</button><button type="button" aria-label="Perbesar halaman" onClick={() => setZoom((value) => Math.min(2.5, Math.round((value + 0.15) * 100) / 100))}>＋</button></div>}
        <button type="button" className="page-button" onClick={nextPage} disabled={loading || (book.format === "pdf" && page >= pages)}>{book.format === "pdf" ? `Berikutnya` : "Berikutnya"} <span aria-hidden="true">→</span></button>
      </nav>
      <div className="reader-progress" role="progressbar" aria-label={`Progres membaca ${percentLabel}%`} aria-valuenow={percentLabel} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${percentLabel}%` }} /></div>

      {finishPrompt && (
        <div className="finish-scrim" role="presentation">
          <section className="finish-dialog" role="dialog" aria-modal="true" aria-labelledby="finish-title">
            <h2 id="finish-title">Hampir <em>selesai</em></h2>
            <p>Progres buku ini sudah mencapai {percentLabel}%. Tandai sebagai selesai?</p>
            <div><button type="button" className="text-button" onClick={() => setFinishPrompt(false)}>Nanti</button><button type="button" className="gold-button" onClick={() => void markFinished()}>Tandai selesai</button></div>
          </section>
        </div>
      )}
    </main>
  );
}
