"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { BookRow } from "@/lib/database.types";

type EditableBook = Pick<BookRow, "id" | "title" | "author" | "language" | "genre" | "year" | "pages" | "synopsis">;

export function BookEditor({ book }: { book: EditableBook }) {
  const router = useRouter();
  const [fields, setFields] = useState({
    title: book.title,
    author: book.author,
    language: book.language,
    genre: book.genre ?? "",
    year: book.year?.toString() ?? "",
    pages: book.pages?.toString() ?? "",
    synopsis: book.synopsis ?? "",
  });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  function set<K extends keyof typeof fields>(key: K, value: (typeof fields)[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage("");
    const response = await fetch(`/api/books/${book.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (response.ok) {
      router.replace(`/books/${book.id}`);
      router.refresh();
      return;
    }
    const result = (await response.json().catch(() => ({}))) as { error?: string };
    setMessage(result.error || "Metadata belum tersimpan.");
    setPending(false);
  }

  return (
    <form className="metadata-form" onSubmit={submit}>
      <div className="metadata-fields">
        <label>Judul buku<input value={fields.title} maxLength={240} required onChange={(event) => set("title", event.target.value)} /></label>
        <label>Penulis<input value={fields.author} maxLength={200} required onChange={(event) => set("author", event.target.value)} /></label>
        <div className="form-pair">
          <label>Bahasa<input value={fields.language} maxLength={80} required onChange={(event) => set("language", event.target.value)} /></label>
          <label>Genre<input value={fields.genre} maxLength={120} onChange={(event) => set("genre", event.target.value)} /></label>
        </div>
        <div className="form-pair">
          <label>Tahun<input type="number" min="1" max="2200" value={fields.year} onChange={(event) => set("year", event.target.value)} /></label>
          <label>Jumlah halaman<input type="number" min="1" max="100000" value={fields.pages} onChange={(event) => set("pages", event.target.value)} /></label>
        </div>
        <label>Sinopsis<textarea value={fields.synopsis} maxLength={5000} rows={5} onChange={(event) => set("synopsis", event.target.value)} /></label>
      </div>
      {message && <p className="form-message is-error" role="alert">{message}</p>}
      <div className="metadata-actions"><span className="quiet-note">Hanya metadata yang dapat diubah di sini.</span><button className="gold-button" type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan perubahan"}</button></div>
    </form>
  );
}
