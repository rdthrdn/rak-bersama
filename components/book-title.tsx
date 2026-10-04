export function BookTitle({ book }: { book: { title: string } }) {
  const split = book.title.lastIndexOf(" ");
  if (split < 0) return <em>{book.title}</em>;
  return <>{book.title.slice(0, split + 1)}<em>{book.title.slice(split + 1)}</em></>;
}
