import { NextResponse, type NextRequest } from "next/server";
import { getMemberContext } from "@/lib/auth";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const context = await getMemberContext();
  if (!context) return NextResponse.json({ error: "Sesi tidak tersedia." }, { status: 401 });
  const { id } = await params;
  const input = (await request.json().catch(() => null)) as { body?: unknown } | null;
  const body = typeof input?.body === "string" ? input.body.trim() : "";
  if (!body || body.length > 5000) return NextResponse.json({ error: "Ulasan harus berisi 1 sampai 5.000 karakter." }, { status: 400 });

  const { data, error } = await context.supabase.from("reviews").insert({
    book_id: id,
    author_id: context.user.id,
    body,
  }).select("id").single();
  if (error || !data) return NextResponse.json({ error: "Ulasan belum tersimpan." }, { status: 400 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}
