import { NextResponse, type NextRequest } from "next/server";
import { getMemberContext } from "@/lib/auth";
import { coverExtension } from "@/lib/file-validation";
import type { BookFormat } from "@/lib/database.types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const context = await getMemberContext();
  if (!context) return NextResponse.json({ error: "Sesi tidak tersedia." }, { status: 401 });
  const input = (await request.json().catch(() => null)) as { bookId?: string; format?: BookFormat; coverType?: string } | null;
  if (!input?.bookId || !uuidPattern.test(input.bookId) || (input.format !== "epub" && input.format !== "pdf")) {
    return NextResponse.json({ error: "Identitas unggahan tidak valid." }, { status: 400 });
  }

  const bookPath = `${context.user.id}/${input.bookId}/book.${input.format}`;
  await context.supabase.storage.from("books").remove([bookPath]);
  if (input.coverType && coverExtension(input.coverType)) {
    const coverPath = `${context.user.id}/${input.bookId}/cover.${coverExtension(input.coverType)}`;
    await context.supabase.storage.from("covers").remove([coverPath]);
  }
  return NextResponse.json({ ok: true });
}
