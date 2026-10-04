import { notFound } from "next/navigation";
import { Reader } from "@/components/reader";
import { requireMember } from "@/lib/auth";
import { getProgress } from "@/lib/book-repository";
import type { BookRow } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function ReadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireMember();
  const { data: book, error } = await supabase.from("books")
    .select("id, owner_id, title, author, language, pages, status, format")
    .eq("id", id)
    .maybeSingle();
  if (error || !book || book.owner_id !== user.id) notFound();

  const progress = await getProgress(supabase, user.id, id);
  const readerBook: Pick<BookRow, "id" | "title" | "author" | "language" | "pages" | "status" | "format"> = book;
  return <Reader book={readerBook} initialLocator={progress?.locator ?? null} initialPercent={Number(progress?.percent ?? 0)} />;
}
