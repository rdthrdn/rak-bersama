import { notFound } from "next/navigation";
import { Reader } from "@/components/reader";
import { books } from "@/data/books";

export default async function ReadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = books.find((entry) => entry.id === id);

  if (!book) notFound();
  return <Reader book={book} />;
}
