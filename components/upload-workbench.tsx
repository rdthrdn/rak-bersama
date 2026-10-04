"use client";

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { extractEpubMetadata } from "@/lib/epub-metadata";
import { coverExtension, detectCoverType, validateSelectedBook } from "@/lib/file-validation";
import { normalizeLanguage } from "@/lib/book-utils";
import { createClient } from "@/lib/supabase/client";
import type { BookFormat, ReadingStatus } from "@/lib/database.types";

type Draft = {
  id: string;
  format: BookFormat;
  coverType: string | null;
  fileName: string;
};

type MetadataDraft = {
  title: string;
  author: string;
  language: string;
  genre: string;
  year: string;
  pages: string;
  synopsis: string;
  status: ReadingStatus;
};

const statuses: { value: ReadingStatus; label: string }[] = [
  { value: "unread", label: "Belum dibaca" },
  { value: "reading", label: "Sedang dibaca" },
  { value: "finished", label: "Selesai" },
  { value: "paused", label: "Dijeda" },
  { value: "dropped", label: "Dihentikan" },
];

async function signedUpload(input: Record<string, unknown>, file: Blob, bucket: "books" | "covers", contentType: string) {
  const response = await fetch("/api/uploads/signed-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    bucket?: "books" | "covers";
    path?: string;
    token?: string;
    error?: string;
  };
  if (!response.ok || !payload.path || !payload.token || payload.bucket !== bucket) {
    throw new Error(payload.error || "Tautan unggah belum tersedia.");
  }

  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(payload.path, payload.token, file, {
    contentType,
    upsert: false,
  });
  if (error) throw new Error("Berkas belum dapat dikirim ke ruang penyimpanan.");
  return payload.path;
}

function filenameTitle(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
}

async function pdfDetails(file: File) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdfDocument = await loadingTask.promise;
  const metadata = await pdfDocument.getMetadata().catch(() => null);
  const info = metadata?.info as Record<string, unknown> | undefined;
  const title = typeof info?.Title === "string" ? info.Title.trim() : "";
  const author = typeof info?.Author === "string" ? info.Author.trim() : "";
  const firstPage = await pdfDocument.getPage(1);
  const initial = firstPage.getViewport({ scale: 1 });
  const viewport = firstPage.getViewport({ scale: Math.min(1, 720 / initial.width) });
  const canvas = window.document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  if (!canvas.getContext("2d")) throw new Error("Pratinjau halaman PDF belum dapat dibuat.");
  await firstPage.render({ canvas, viewport }).promise;
  const cover = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
  canvas.width = 0;
  canvas.height = 0;
  const totalPages = String(pdfDocument.numPages);
  await loadingTask.destroy();
  return { title, author, totalPages, cover };
}

function initialMetadata(title: string): MetadataDraft {
  return { title, author: "", language: "Inggris", genre: "", year: "", pages: "", synopsis: "", status: "unread" };
}

export function UploadWorkbench() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [metadata, setMetadata] = useState<MetadataDraft>(initialMetadata(""));
  const [message, setMessage] = useState("");
  const [problem, setProblem] = useState("");

  async function receiveFile(file?: File) {
    if (!file || busy) return;
    setProblem("");
    setMessage("");
    setBusy(true);
    let bookId = "";
    let format: BookFormat | null = null;
    let coverType: string | null = null;

    try {
      format = await validateSelectedBook(file);
      const fallbackTitle = filenameTitle(file.name);
      let nextMetadata = initialMetadata(fallbackTitle);
      let cover: Blob | null = null;

      if (format === "epub") {
        try {
          const epub = await extractEpubMetadata(file);
          nextMetadata = {
            ...nextMetadata,
            title: epub.title || fallbackTitle,
            author: epub.author,
            language: epub.language ? normalizeLanguage(epub.language) : "Inggris",
            synopsis: epub.description,
          };
          cover = epub.cover;
        } catch {
          setMessage("Berkas valid. Metadata EPUB tidak terbaca dan dapat diisi secara manual.");
        }
      } else {
        try {
          const pdf = await pdfDetails(file);
          nextMetadata = {
            ...nextMetadata,
            title: pdf.title || fallbackTitle,
            author: pdf.author,
            pages: pdf.totalPages,
          };
          cover = pdf.cover;
        } catch {
          setMessage("Berkas PDF valid. Metadata dan sampul halaman pertama perlu diisi secara manual.");
        }
      }

      bookId = crypto.randomUUID();
      await signedUpload({ bookId, kind: "book", format, size: file.size }, file, "books", format === "epub" ? "application/epub+zip" : "application/pdf");

      if (cover && cover.size > 0) {
        const bytes = new Uint8Array(await cover.arrayBuffer());
        coverType = detectCoverType(bytes);
        const extension = coverType && coverExtension(coverType);
        if (coverType && extension && cover.size <= 5 * 1024 * 1024) {
          try {
            await signedUpload({ bookId, kind: "cover", contentType: coverType, size: cover.size }, cover, "covers", coverType);
          } catch {
            coverType = null;
            setMessage("Berkas tersimpan, sampul tidak dapat diunggah. Sampul pola akan digunakan.");
          }
        } else {
          coverType = null;
        }
      }

      setDraft({ id: bookId, format, coverType, fileName: file.name });
      setMetadata(nextMetadata);
      setMessage((current) => current || "Berkas tersimpan sementara. Periksa metadata sebelum menyimpan buku.");
    } catch (error) {
      if (bookId && format) {
        await fetch("/api/uploads/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId, format, coverType }),
        }).catch(() => undefined);
      }
      setProblem(error instanceof Error ? error.message : "Berkas belum dapat diproses.");
    } finally {
      setBusy(false);
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void receiveFile(event.dataTransfer.files[0]);
  }

  async function saveBook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || busy) return;
    setBusy(true);
    setProblem("");
    setMessage("Memeriksa berkas dan menyimpan metadata…");
    try {
      const response = await fetch("/api/uploads/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...metadata, bookId: draft.id, format: draft.format, coverType: draft.coverType }),
      });
      const result = (await response.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!response.ok || !result.id) throw new Error(result.error || "Metadata belum tersimpan.");
      window.location.assign(`/books/${result.id}`);
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "Metadata belum tersimpan.");
      setMessage("");
    } finally {
      setBusy(false);
    }
  }

  async function cancelDraft() {
    if (!draft || busy) return;
    setBusy(true);
    await fetch("/api/uploads/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId: draft.id, format: draft.format, coverType: draft.coverType }),
    }).catch(() => undefined);
    setDraft(null);
    setMetadata(initialMetadata(""));
    setMessage("");
    setProblem("");
    setBusy(false);
  }

  function update<K extends keyof MetadataDraft>(key: K, value: MetadataDraft[K]) {
    setMetadata((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="upload-workbench">
      {!draft ? (
        <div
          className={`drop-zone${dragging ? " is-dragging" : ""}`}
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }}
          onDrop={onDrop}
        >
          <div className="drop-mark" aria-hidden="true">＋</div>
          <h2>{busy ? "Memeriksa dan mengunggah" : "Letakkan berkas buku di sini"}</h2>
          <p>EPUB atau PDF · Maksimal 50 MB</p>
          <button className="outline-button" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
            Pilih berkas
          </button>
          <input ref={inputRef} className="visually-hidden" type="file" accept=".epub,.pdf,application/epub+zip,application/pdf" onChange={(event) => void receiveFile(event.target.files?.[0])} />
        </div>
      ) : (
        <form className="metadata-form" onSubmit={saveBook}>
          <div className="upload-file-note">
            <span className="format-mark">{draft.format.toUpperCase()}</span>
            <span>{draft.fileName}</span>
            <button className="text-button" type="button" onClick={() => void cancelDraft()} disabled={busy}>Batalkan</button>
          </div>
          <div className="metadata-fields">
            <label>Judul buku<input value={metadata.title} maxLength={240} onChange={(event) => update("title", event.target.value)} required /></label>
            <label>Penulis<input value={metadata.author} maxLength={200} onChange={(event) => update("author", event.target.value)} required /></label>
            <div className="form-pair">
              <label>Bahasa<input value={metadata.language} maxLength={80} onChange={(event) => update("language", event.target.value)} required /></label>
              <label>Genre<input value={metadata.genre} maxLength={120} onChange={(event) => update("genre", event.target.value)} /></label>
            </div>
            <div className="form-pair">
              <label>Tahun<input type="number" min="1" max="2200" value={metadata.year} onChange={(event) => update("year", event.target.value)} /></label>
              <label>Jumlah halaman<input type="number" min="1" max="100000" value={metadata.pages} onChange={(event) => update("pages", event.target.value)} /></label>
            </div>
            <label>Sinopsis<textarea value={metadata.synopsis} maxLength={5000} rows={4} onChange={(event) => update("synopsis", event.target.value)} /></label>
            <label>Status membaca<select value={metadata.status} onChange={(event) => update("status", event.target.value as ReadingStatus)}>{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
          </div>
          <div className="metadata-actions">
            <p className="quiet-note">Metadata dapat diperbarui setelah buku disimpan.</p>
            <button className="gold-button" type="submit" disabled={busy}>{busy ? "Menyimpan…" : "Simpan buku"}</button>
          </div>
        </form>
      )}
      {message && <p className="form-message" role="status">{message}</p>}
      {problem && <p className="form-message is-error" role="alert">{problem}</p>}
      <p className="upload-privacy-note">Berkas disimpan di ruang privat. Anggota lain tidak dapat membuka file buku.</p>
    </div>
  );
}
