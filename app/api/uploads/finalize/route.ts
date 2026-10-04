import { NextResponse, type NextRequest } from "next/server";
import { getMemberContext } from "@/lib/auth";
import { coverExtension, detectCoverType, MAX_COVER_BYTES, validateBookBytes } from "@/lib/file-validation";
import type { BookFormat, ReadingStatus } from "@/lib/database.types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const statuses = new Set<ReadingStatus>(["reading", "finished", "dropped", "paused", "unread"]);

function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export async function POST(request: NextRequest) {
  const context = await getMemberContext();
  if (!context) return NextResponse.json({ error: "Sesi tidak tersedia." }, { status: 401 });

  const input = (await request.json().catch(() => null)) as {
    bookId?: string;
    format?: BookFormat;
    title?: unknown;
    author?: unknown;
    language?: unknown;
    genre?: unknown;
    year?: unknown;
    pages?: unknown;
    synopsis?: unknown;
    status?: ReadingStatus;
    coverType?: string;
  } | null;
  if (!input?.bookId || !uuidPattern.test(input.bookId) || (input.format !== "epub" && input.format !== "pdf")) {
    return NextResponse.json({ error: "Data buku tidak valid." }, { status: 400 });
  }

  const title = cleanText(input.title, 240);
  const author = cleanText(input.author, 200);
  const language = cleanText(input.language, 80);
  const genre = cleanText(input.genre, 120) || null;
  const synopsis = cleanText(input.synopsis, 5000) || null;
  const year = input.year === "" || input.year === null || input.year === undefined ? null : Number(input.year);
  const pages = input.pages === "" || input.pages === null || input.pages === undefined ? null : Number(input.pages);
  const status = input.status && statuses.has(input.status) ? input.status : "unread";

  if (!title || !author || !language || (year !== null && (!Number.isInteger(year) || year < 1 || year > 2200)) || (pages !== null && (!Number.isInteger(pages) || pages < 1 || pages > 100000))) {
    return NextResponse.json({ error: "Lengkapi judul, penulis, bahasa, tahun, dan jumlah halaman dengan benar." }, { status: 400 });
  }

  const bookPath = `${context.user.id}/${input.bookId}/book.${input.format}`;
  const { data: file, error: fileError } = await context.supabase.storage.from("books").download(bookPath);
  if (fileError || !file) return NextResponse.json({ error: "Berkas belum tersedia di ruang penyimpanan." }, { status: 400 });
  const bookBytes = new Uint8Array(await file.arrayBuffer());
  try {
    await validateBookBytes(bookBytes, input.format);
  } catch (error) {
    await context.supabase.storage.from("books").remove([bookPath]);
    const message = error instanceof Error ? error.message : "Berkas buku tidak valid.";
    return NextResponse.json({ error: message }, { status: 422 });
  }

  let coverPath: string | null = null;
  if (input.coverType) {
    const extension = coverExtension(input.coverType);
    if (!extension) return NextResponse.json({ error: "Format sampul tidak didukung." }, { status: 400 });
    const candidate = `${context.user.id}/${input.bookId}/cover.${extension}`;
    const { data: cover, error: coverError } = await context.supabase.storage.from("covers").download(candidate);
    if (coverError || !cover || cover.size > MAX_COVER_BYTES) {
      await context.supabase.storage.from("books").remove([bookPath]);
      return NextResponse.json({ error: "Berkas sampul belum tersedia atau terlalu besar." }, { status: 400 });
    }
    const realType = detectCoverType(new Uint8Array(await cover.arrayBuffer()));
    if (realType !== input.coverType) {
      await context.supabase.storage.from("books").remove([bookPath]);
      await context.supabase.storage.from("covers").remove([candidate]);
      return NextResponse.json({ error: "Isi berkas sampul tidak sesuai dengan formatnya." }, { status: 422 });
    }
    coverPath = candidate;
  }

  const { data: book, error } = await context.supabase.from("books").insert({
    id: input.bookId,
    owner_id: context.user.id,
    title,
    author,
    language,
    genre,
    year,
    pages,
    synopsis,
    status,
    format: input.format,
    file_path: bookPath,
    cover_path: coverPath,
  }).select("id").single();

  if (error || !book) {
    await context.supabase.storage.from("books").remove([bookPath]);
    if (coverPath) await context.supabase.storage.from("covers").remove([coverPath]);
    return NextResponse.json({ error: "Metadata buku belum tersimpan." }, { status: 400 });
  }

  const response = NextResponse.json({ id: book.id }, { status: 201 });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
