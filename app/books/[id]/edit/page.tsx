import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BookEditor } from "@/components/book-editor";
import { requireMember } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireMember();
  const { data: book, error } = await supabase.from("books")
    .select("id, owner_id, title, author, language, genre, year, pages, synopsis")
    .eq("id", id)
    .maybeSingle();
  if (error || !book) notFound();
  if (book.owner_id !== user.id) redirect(`/books/${id}`);

  return (
    <main className="edit-page page-shell">
      <header className="simple-header"><Link href={`/books/${id}`} className="back-link">← Kembali ke buku</Link><Link href="/" className="wordmark">Rak <em>bersama</em></Link></header>
      <section className="edit-content">
        <h1>Ubah <em>metadata</em></h1>
        <p>Perubahan ini terlihat pada rak bersama. Berkas buku tetap berada di ruang privat Anda.</p>
        <BookEditor book={book} />
      </section>
    </main>
  );
}
