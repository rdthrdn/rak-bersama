import { NextResponse, type NextRequest } from "next/server";
import { getMemberContext } from "@/lib/auth";
import { validateBookBytes } from "@/lib/file-validation";

const SIGNED_URL_TTL_SECONDS = 60;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getMemberContext();
  if (!context) return NextResponse.json({ error: "Sesi tidak tersedia." }, { status: 401 });
  const { id } = await params;
  const { data: book, error } = await context.supabase.from("books")
    .select("id, owner_id, file_path, format")
    .eq("id", id)
    .maybeSingle();
  if (error || !book) return NextResponse.json({ error: "Buku tidak ditemukan." }, { status: 404 });
  if (book.owner_id !== context.user.id || !book.file_path.startsWith(`${context.user.id}/`)) {
    return NextResponse.json({ error: "Berkas ini hanya dapat dibuka oleh pemiliknya." }, { status: 403 });
  }

  const { data: file, error: fileError } = await context.supabase.storage.from("books").download(book.file_path);
  if (fileError || !file) return NextResponse.json({ error: "Berkas belum tersedia." }, { status: 404 });
  try {
    await validateBookBytes(new Uint8Array(await file.arrayBuffer()), book.format);
  } catch {
    return NextResponse.json({ error: "Isi berkas tidak lolos pemeriksaan." }, { status: 422 });
  }

  const { data: signed, error: signError } = await context.supabase.storage
    .from("books")
    .createSignedUrl(book.file_path, SIGNED_URL_TTL_SECONDS);
  if (signError || !signed) return NextResponse.json({ error: "Tautan baca belum dapat dibuat." }, { status: 500 });

  const response = NextResponse.json({ url: signed.signedUrl, format: book.format, expiresIn: SIGNED_URL_TTL_SECONDS });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
