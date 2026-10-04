import { describe, expect, it } from "vitest";
import { normalizeLanguage, normalizeTitleAuthor, statusText } from "@/lib/book-utils";

describe("metadata buku", () => {
  it("menyamakan judul dan penulis yang berbeda tanda baca atau aksen", () => {
    expect(normalizeTitleAuthor("Le Petit-Prince")).toBe(normalizeTitleAuthor("Le Petit Prince"));
    expect(normalizeTitleAuthor("José Rizal")).toBe(normalizeTitleAuthor("Jose   Rizal"));
  });

  it("menampilkan bahasa dan status dengan label Indonesia", () => {
    expect(normalizeLanguage("en-US")).toBe("Inggris");
    expect(normalizeLanguage("id")).toBe("Indonesia");
    expect(statusText("unread")).toBe("Belum dibaca");
  });
});
