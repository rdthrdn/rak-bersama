import { notFound } from "next/navigation";
import { BookDetail } from "@/components/book-detail";
import { books } from "@/data/books";

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = books.find((entry) => entry.id === id);

  if (!book) notFound();
  return <BookDetail book={book} />;
}
