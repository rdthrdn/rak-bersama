import type { Book, ReadingStatus } from "@/data/books";

export function displayTitle(book: Book): string {
  return book.displayTitle || book.title;
}

export function statusText(status: ReadingStatus): string {
  const labels: Record<ReadingStatus, string> = {
    Reading: "Sedang dibaca",
    Finished: "Selesai",
    Dropped: "Dihentikan",
    Paused: "Dijeda",
  };
  return labels[status];
}

export function seedFromId(id: string): number {
  return Array.from(id).reduce((value, character) => value + character.charCodeAt(0), 0);
}
