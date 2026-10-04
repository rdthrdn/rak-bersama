"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ReviewView } from "@/lib/database.types";

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

export function ReviewList({ bookId, reviews }: { bookId: string; reviews: ReviewView[] }) {
  const router = useRouter();
  const [items, setItems] = useState(reviews);
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => setItems(reviews), [reviews]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim() || pending) return;
    setPending(true);
    setMessage("");
    const response = await fetch(`/api/books/${bookId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (response.ok) {
      setBody("");
      router.refresh();
    } else {
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      setMessage(result.error || "Ulasan belum tersimpan.");
    }
    setPending(false);
  }

  async function saveEdit(id: string) {
    setPending(true);
    setMessage("");
    const response = await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: editingBody }),
    });
    if (response.ok) {
      setEditing(null);
      router.refresh();
    } else {
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      setMessage(result.error || "Ulasan belum diperbarui.");
    }
    setPending(false);
  }

  async function remove(id: string) {
    setPending(true);
    setMessage("");
    const response = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    if (response.ok) {
      setItems((current) => current.filter((item) => item.id !== id));
      router.refresh();
    } else {
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      setMessage(result.error || "Ulasan belum dihapus.");
    }
    setPending(false);
  }

  return (
    <div className="reviews-wrap">
      {items.length ? (
        <ul className="review-list">
          {items.map((review) => (
            <li className="review-item" key={review.id}>
              <span className="member-avatar" aria-hidden="true">{review.author_initials}</span>
              <div className="review-copy">
                <div className="review-meta"><strong>{review.author_name}</strong><time dateTime={review.created_at}>{dateLabel(review.created_at)}</time></div>
                {editing === review.id ? (
                  <div className="review-edit-form"><textarea value={editingBody} maxLength={5000} rows={3} onChange={(event) => setEditingBody(event.target.value)} /><div><button className="text-button" type="button" onClick={() => setEditing(null)}>Batal</button><button className="text-button" type="button" disabled={pending} onClick={() => void saveEdit(review.id)}>Simpan</button></div></div>
                ) : <p>{review.body}</p>}
                {review.viewer_is_author && editing !== review.id && <div className="review-actions"><button className="text-button" type="button" onClick={() => { setEditing(review.id); setEditingBody(review.body); }}>Ubah</button><button className="text-button destructive-button" type="button" disabled={pending} onClick={() => void remove(review.id)}>Hapus</button></div>}
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="empty-inline">Belum ada ulasan untuk buku ini.</p>}

      <form className="review-form" onSubmit={submit}>
        <label htmlFor={`review-${bookId}`}>Tulis ulasan</label>
        <textarea id={`review-${bookId}`} value={body} maxLength={5000} rows={4} onChange={(event) => setBody(event.target.value)} placeholder="Catatan singkat tentang buku ini" />
        <div className="review-form-footer"><span>{body.length} / 5.000</span><button type="submit" className="outline-button" disabled={pending || !body.trim()}>Simpan ulasan</button></div>
      </form>
      {message && <p className="form-message is-error" role="alert">{message}</p>}
    </div>
  );
}
