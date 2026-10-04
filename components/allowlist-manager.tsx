"use client";

import { useState, useTransition, type FormEvent } from "react";

export function AllowlistManager({ emails }: { emails: string[] }) {
  const [entries, setEntries] = useState(emails);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  async function change(action: "add" | "remove", value: string) {
    setMessage("");
    const response = await fetch("/api/admin/allowlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, email: value }),
    });
    const result = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) throw new Error(result.error || "Daftar anggota belum berubah.");
    setEntries((current) =>
      action === "add"
        ? [...new Set([...current, value.toLowerCase()])].sort()
        : current.filter((entry) => entry !== value),
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value) return;
    startTransition(() => {
      void change("add", value).then(() => setEmail("")).catch((error: Error) => setMessage(error.message));
    });
  }

  function remove(value: string) {
    startTransition(() => {
      void change("remove", value).catch((error: Error) => setMessage(error.message));
    });
  }

  return (
    <div className="allowlist">
      <form className="allowlist-form" onSubmit={submit}>
        <label htmlFor="invite-email">Alamat email</label>
        <div className="field-row">
          <input id="invite-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@contoh.id" required />
          <button className="gold-button" type="submit" disabled={pending}>Tambah alamat</button>
        </div>
      </form>
      {message && <p className="form-message" role="alert">{message}</p>}
      <ul className="allowlist-list">
        {entries.map((entry) => (
          <li key={entry}>
            <span>{entry}</span>
            <button type="button" className="text-button" disabled={pending} onClick={() => remove(entry)}>Hapus</button>
          </li>
        ))}
      </ul>
      {!entries.length && <p className="empty-state">Belum ada alamat yang ditambahkan.</p>}
    </div>
  );
}
