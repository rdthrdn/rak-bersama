import { NextResponse, type NextRequest } from "next/server";
import { getMemberContext } from "@/lib/auth";
import type { Database, ReadingStatus } from "@/lib/database.types";

const statuses = new Set<ReadingStatus>(["reading", "finished", "dropped", "paused", "unread"]);

function stringValue(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getMemberContext();
  if (!context) return NextResponse.json({ error: "Sesi tidak tersedia." }, { status: 401 });
  const { id } = await params;
  const input = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!input) return NextResponse.json({ error: "Perubahan buku tidak valid." }, { status: 400 });

  const updates: Database["public"]["Tables"]["books"]["Update"] = {};
  if ("status" in input) {
    if (typeof input.status !== "string" || !statuses.has(input.status as ReadingStatus)) {
      return NextResponse.json({ error: "Status membaca tidak valid." }, { status: 400 });
    }
    updates.status = input.status as ReadingStatus;
  }
  if ("title" in input) {
    const title = stringValue(input.title, 240);
    if (!title) return NextResponse.json({ error: "Judul buku wajib diisi." }, { status: 400 });
    updates.title = title;
  }
  if ("author" in input) {
    const author = stringValue(input.author, 200);
    if (!author) return NextResponse.json({ error: "Nama penulis wajib diisi." }, { status: 400 });
    updates.author = author;
  }
  if ("language" in input) {
    const language = stringValue(input.language, 80);
    if (!language) return NextResponse.json({ error: "Bahasa wajib diisi." }, { status: 400 });
    updates.language = language;
  }
  if ("genre" in input) updates.genre = stringValue(input.genre, 120) || null;
  if ("synopsis" in input) updates.synopsis = stringValue(input.synopsis, 5000) || null;
  if ("year" in input) {
    const year = input.year === "" || input.year === null ? null : Number(input.year);
    if (year !== null && (!Number.isInteger(year) || year < 1 || year > 2200)) return NextResponse.json({ error: "Tahun terbit tidak valid." }, { status: 400 });
    updates.year = year;
  }
  if ("pages" in input) {
    const pages = input.pages === "" || input.pages === null ? null : Number(input.pages);
    if (pages !== null && (!Number.isInteger(pages) || pages < 1 || pages > 100000)) return NextResponse.json({ error: "Jumlah halaman tidak valid." }, { status: 400 });
    updates.pages = pages;
  }
  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "Periksa kembali metadata buku." }, { status: 400 });
  }

  const { data, error } = await context.supabase.from("books").update(updates).eq("id", id).eq("owner_id", context.user.id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Perubahan buku belum tersimpan." }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Buku tidak ditemukan atau bukan milik Anda." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getMemberContext();
  if (!context) return NextResponse.json({ error: "Sesi tidak tersedia." }, { status: 401 });
  const { id } = await params;
  const { data: book, error: bookError } = await context.supabase
    .from("books")
    .select("id, owner_id, file_path, cover_path")
    .eq("id", id)
    .maybeSingle();
  if (bookError || !book) return NextResponse.json({ error: "Buku tidak ditemukan." }, { status: 404 });
  if (book.owner_id !== context.user.id) return NextResponse.json({ error: "Hanya pemilik yang dapat menghapus buku." }, { status: 403 });

  const { error: fileError } = await context.supabase.storage.from("books").remove([book.file_path]);
  if (fileError) return NextResponse.json({ error: "Berkas buku belum dapat dihapus." }, { status: 500 });
  if (book.cover_path) {
    const { error: coverError } = await context.supabase.storage.from("covers").remove([book.cover_path]);
    if (coverError) return NextResponse.json({ error: "Sampul belum dapat dihapus." }, { status: 500 });
  }
  const { error: deleteError } = await context.supabase.from("books").delete().eq("id", id).eq("owner_id", context.user.id);
  if (deleteError) return NextResponse.json({ error: "Data buku belum dapat dihapus." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
