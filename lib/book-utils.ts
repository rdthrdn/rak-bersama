import type { ReadingStatus } from "@/lib/database.types";

const statusLabels: Record<ReadingStatus, string> = {
  reading: "Sedang dibaca",
  finished: "Selesai",
  dropped: "Dihentikan",
  paused: "Dijeda",
  unread: "Belum dibaca",
};

export function statusText(status: ReadingStatus) {
  return statusLabels[status];
}

export function normalizeTitleAuthor(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("id-ID")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeLanguage(value: string) {
  const normalized = value.trim().toLowerCase().replace(/_/g, "-");
  const base = normalized.split("-")[0];
  const known: Record<string, string> = {
    en: "Inggris",
    eng: "Inggris",
    id: "Indonesia",
    ind: "Indonesia",
    ko: "Korea",
    kor: "Korea",
  };
  return known[normalized] ?? known[base] ?? value.trim();
}

export function seedFromId(id: string) {
  return Array.from(id).reduce((value, character) => value + character.codePointAt(0)!, 0);
}
