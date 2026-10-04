import { notFound } from "next/navigation";
import { BookDetail, BookDetailError } from "@/components/book-detail";
import { requireMember } from "@/lib/auth";
import { getBookDetailData } from "@/lib/book-repository";

export const dynamic = "force-dynamic";

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireMember();
  let data: Awaited<ReturnType<typeof getBookDetailData>>;
  try {
    data = await getBookDetailData(supabase, user.id, id);
  } catch {
    return <BookDetailError />;
  }
  if (!data) notFound();
  return <BookDetail data={data} />;
}
