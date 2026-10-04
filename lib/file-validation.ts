import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import type { BookFormat } from "@/lib/database.types";

export const MAX_BOOK_BYTES = 50 * 1024 * 1024;
export const MAX_COVER_BYTES = 5 * 1024 * 1024;
const MAX_ARCHIVE_ENTRIES = 20_000;
const MAX_EXPANDED_ARCHIVE_BYTES = 512 * 1024 * 1024;
const MAX_CONTAINER_BYTES = 1024 * 1024;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  trimValues: true,
  textNodeName: "#text",
});

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function attribute(value: unknown, key: string) {
  if (!value || typeof value !== "object") return "";
  const entry = (value as Record<string, unknown>)[`@_${key}`];
  return typeof entry === "string" ? entry.trim() : "";
}

function safeArchivePath(path: string) {
  let decoded: string;
  try {
    decoded = decodeURIComponent(path.replaceAll("\\", "/")).replace(/^\/+/, "");
  } catch {
    return null;
  }
  const segments = decoded.split("/");
  if (!decoded || segments.some((segment) => segment === ".." || segment === ".")) return null;
  return decoded;
}

export function assertSafeArchive(zip: JSZip) {
  const entries = Object.values(zip.files);
  if (entries.length > MAX_ARCHIVE_ENTRIES) throw new Error("EPUB memiliki terlalu banyak entri ZIP.");
  const expandedBytes = entries.reduce((total, entry) => {
    const size = (entry as JSZip.JSZipObject & { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0;
    return total + size;
  }, 0);
  if (expandedBytes > MAX_EXPANDED_ARCHIVE_BYTES) throw new Error("Isi EPUB melampaui batas pemrosesan.");
}

export async function epubPackagePath(zip: JSZip) {
  assertSafeArchive(zip);
  const containerFile = zip.file("META-INF/container.xml");
  if (!containerFile) throw new Error("Berkas EPUB tidak memiliki META-INF/container.xml.");
  const containerSize = (containerFile as JSZip.JSZipObject & { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0;
  if (containerSize > MAX_CONTAINER_BYTES) throw new Error("Daftar isi EPUB terlalu besar.");

  let parsed: Record<string, unknown>;
  try {
    parsed = xmlParser.parse(await containerFile.async("string")) as Record<string, unknown>;
  } catch {
    throw new Error("Daftar isi EPUB tidak valid.");
  }
  const container = parsed.container as Record<string, unknown> | undefined;
  const rootfiles = container?.rootfiles as Record<string, unknown> | undefined;
  const rootfile = asArray(rootfiles?.rootfile as Record<string, unknown> | Record<string, unknown>[] | undefined)
    .map((entry) => attribute(entry, "full-path"))
    .map(safeArchivePath)
    .find(Boolean);
  if (!rootfile || !zip.file(rootfile)) throw new Error("Paket EPUB tidak menunjuk ke berkas OPF yang tersedia.");
  return rootfile;
}

export async function validateBookBytes(bytes: Uint8Array, format: BookFormat) {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_BOOK_BYTES) {
    throw new Error("Ukuran berkas harus kurang dari atau sama dengan 50 MB.");
  }

  if (format === "pdf") {
    const signature = new TextDecoder().decode(bytes.subarray(0, 5));
    if (signature !== "%PDF-") throw new Error("Berkas ini tidak memiliki tanda tangan PDF yang valid.");
    return;
  }

  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 0x03 || bytes[3] !== 0x04) {
    throw new Error("EPUB harus berupa arsip ZIP yang valid.");
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes, { checkCRC32: false, createFolders: false });
  } catch {
    throw new Error("Isi ZIP EPUB tidak dapat dibaca.");
  }
  try {
    await epubPackagePath(zip);
  } catch {
    throw new Error("Berkas EPUB tidak memiliki container.xml atau OPF yang valid.");
  }
}

export function detectCoverType(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes.subarray(0, 8).every((value, index) => value === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index])) return "image/png";
  if (
    bytes.length >= 12 &&
    new TextDecoder().decode(bytes.subarray(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.subarray(8, 12)) === "WEBP"
  ) return "image/webp";
  return null;
}

export function coverExtension(contentType: string) {
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return null;
}

export function detectBookFormat(bytes: Uint8Array): BookFormat | null {
  if (new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-") return "pdf";
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) return "epub";
  return null;
}

export async function validateSelectedBook(file: File): Promise<BookFormat> {
  if (file.size === 0 || file.size > MAX_BOOK_BYTES) {
    throw new Error("Pilih berkas dengan ukuran sampai 50 MB.");
  }
  const bytes = new Uint8Array(await file.slice(0, Math.min(file.size, 64 * 1024)).arrayBuffer());
  const format = detectBookFormat(bytes);
  if (!format) throw new Error("Berkas harus berupa EPUB atau PDF yang valid.");
  await validateBookBytes(new Uint8Array(await file.arrayBuffer()), format);
  return format;
}
