import { NextResponse, type NextRequest } from "next/server";
import { getMemberContext } from "@/lib/auth";
import { coverExtension, MAX_BOOK_BYTES, MAX_COVER_BYTES } from "@/lib/file-validation";
import type { BookFormat } from "@/lib/database.types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const context = await getMemberContext();
  if (!context) return NextResponse.json({ error: "Sesi tidak tersedia." }, { status: 401 });

  const input = (await request.json().catch(() => null)) as {
    bookId?: string;
    kind?: string;
    format?: BookFormat;
    size?: number;
    contentType?: string;
  } | null;
  if (!input?.bookId || !uuidPattern.test(input.bookId)) {
    return NextResponse.json({ error: "Identitas berkas tidak valid." }, { status: 400 });
  }

  let bucket: "books" | "covers";
  let path: string;
  let sizeLimit: number;
  let contentType: string;

  if (input.kind === "book" && (input.format === "epub" || input.format === "pdf")) {
    bucket = "books";
    sizeLimit = MAX_BOOK_BYTES;
    contentType = input.format === "epub" ? "application/epub+zip" : "application/pdf";
    path = `${context.user.id}/${input.bookId}/book.${input.format}`;
  } else if (input.kind === "cover" && input.contentType && coverExtension(input.contentType)) {
    bucket = "covers";
    sizeLimit = MAX_COVER_BYTES;
    contentType = input.contentType;
    path = `${context.user.id}/${input.bookId}/cover.${coverExtension(input.contentType)}`;
  } else {
    return NextResponse.json({ error: "Jenis berkas tidak didukung." }, { status: 400 });
  }

  if (!Number.isSafeInteger(input.size) || (input.size ?? 0) < 1 || (input.size ?? sizeLimit + 1) > sizeLimit) {
    return NextResponse.json({ error: "Ukuran berkas melampaui batas." }, { status: 413 });
  }

  const { data, error } = await context.supabase.storage.from(bucket).createSignedUploadUrl(path, { upsert: false });
  if (error || !data) return NextResponse.json({ error: "Tautan unggah belum dapat dibuat." }, { status: 400 });

  const response = NextResponse.json({ bucket, path: data.path, token: data.token, contentType });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
