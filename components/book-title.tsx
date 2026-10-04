import type { Book } from "@/data/books";
import { displayTitle } from "@/lib/book-utils";

export function BookTitle({ book }: { book: Book }) {
  const title = displayTitle(book);
  const index = title.indexOf(book.accentWord);

  if (index < 0) return <>{title}</>;

  return (
    <>
      {title.slice(0, index)}
      <em>{book.accentWord}</em>
      {title.slice(index + book.accentWord.length)}
    </>
  );
}
