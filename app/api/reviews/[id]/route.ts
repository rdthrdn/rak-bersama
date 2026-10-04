import { NextResponse, type NextRequest } from "next/server";
import { getMemberContext } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getMemberContext();
  if (!context) return NextResponse.json({ error: "Sesi tidak tersedia." }, { status: 401 });
  const { id } = await params;
  const input = (await request.json().catch(() => null)) as { body?: unknown } | null;
  const body = typeof input?.body === "string" ? input.body.trim() : "";
  if (!body || body.length > 5000) return NextResponse.json({ error: "Ulasan harus berisi 1 sampai 5.000 karakter." }, { status: 400 });
  const { data, error } = await context.supabase.from("reviews").update({ body })
    .eq("id", id).eq("author_id", context.user.id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Ulasan belum diperbarui." }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Ulasan tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getMemberContext();
  if (!context) return NextResponse.json({ error: "Sesi tidak tersedia." }, { status: 401 });
  const { id } = await params;
  const { data, error } = await context.supabase.from("reviews").delete()
    .eq("id", id).eq("author_id", context.user.id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Ulasan belum dihapus." }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Ulasan tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
