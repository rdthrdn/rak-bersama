import { NextResponse, type NextRequest } from "next/server";
import { getMemberContext } from "@/lib/auth";

async function ownerBook(context: Awaited<ReturnType<typeof getMemberContext>>, bookId: string) {
  if (!context) return { context: null, book: null };
  const { data: book, error } = await context.supabase.from("books")
    .select("id, owner_id, format")
    .eq("id", bookId)
    .maybeSingle();
  if (error || !book || book.owner_id !== context.user.id) return { context, book: null };
  return { context, book };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getMemberContext();
  if (!context) return NextResponse.json({ error: "Sesi tidak tersedia." }, { status: 401 });
  const { id } = await params;
  const result = await ownerBook(context, id);
  if (!result.book) return NextResponse.json({ error: "Buku tidak ditemukan atau bukan milik Anda." }, { status: 404 });
  const { data, error } = await context.supabase.from("reading_progress")
    .select("locator, percent, updated_at")
    .eq("user_id", context.user.id)
    .eq("book_id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Progres belum dapat dimuat." }, { status: 500 });
  return NextResponse.json({ progress: data ?? null }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getMemberContext();
  if (!context) return NextResponse.json({ error: "Sesi tidak tersedia." }, { status: 401 });
  const { id } = await params;
  const { book } = await ownerBook(context, id);
  if (!book || !context) return NextResponse.json({ error: "Buku tidak ditemukan atau bukan milik Anda." }, { status: 404 });

  const input = (await request.json().catch(() => null)) as { locator?: unknown; percent?: unknown } | null;
  const percent = Number(input?.percent);
  const locator = input?.locator;
  if (!Number.isFinite(percent) || percent < 0 || percent > 100 || !locator || typeof locator !== "object" || Array.isArray(locator)) {
    return NextResponse.json({ error: "Posisi baca tidak valid." }, { status: 400 });
  }
  let safeLocator: Record<string, string | number>;
  if (book.format === "epub") {
    const cfi = (locator as Record<string, unknown>).cfi;
    if (typeof cfi !== "string" || !cfi.startsWith("epubcfi(") || cfi.length > 2048) {
      return NextResponse.json({ error: "Lokasi EPUB tidak valid." }, { status: 400 });
    }
    safeLocator = { format: "epub", cfi };
  } else {
    const page = Number((locator as Record<string, unknown>).page);
    const totalPages = Number((locator as Record<string, unknown>).totalPages);
    if (!Number.isInteger(page) || !Number.isInteger(totalPages) || totalPages < 1 || page < 1 || page > totalPages) {
      return NextResponse.json({ error: "Halaman PDF tidak valid." }, { status: 400 });
    }
    safeLocator = { format: "pdf", page, totalPages };
  }

  const { error } = await context.supabase.from("reading_progress").upsert({
    user_id: context.user.id,
    book_id: id,
    locator: safeLocator,
    percent: Math.round(percent * 100) / 100,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,book_id" });
  if (error) return NextResponse.json({ error: "Progres belum tersimpan." }, { status: 400 });
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
}
