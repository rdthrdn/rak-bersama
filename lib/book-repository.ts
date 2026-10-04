import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { BookCard, BookRow, Database, ProfileRow, ReadingProgressRow, ReviewRow, ReviewView } from "@/lib/database.types";
import { normalizeTitleAuthor } from "@/lib/book-utils";

export type ShelfView = "mine" | "shared";

export type BookDetailData = {
  book: BookCard;
  matchingBooks: Array<{
    id: string;
    title: string;
    author: string;
    status: BookRow["status"];
    owner: Pick<ProfileRow, "id" | "display_name" | "initials"> | null;
    cover_url: string | null;
  }>;
  reviews: ReviewView[];
};

function fail(message: string): never {
  throw new Error(message);
}

async function enrichBooks(
  supabase: SupabaseClient<Database>,
  rows: BookRow[],
  viewerId: string,
): Promise<BookCard[]> {
  if (!rows.length) return [];
  const ownerIds = [...new Set(rows.map((book) => book.owner_id))];
  const bookIds = rows.map((book) => book.id);
  const [{ data: profiles, error: profileError }, { data: progresses, error: progressError }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, initials, role").in("id", ownerIds),
    supabase.from("reading_progress").select("book_id, percent").eq("user_id", viewerId).in("book_id", bookIds),
  ]);
  if (profileError || progressError) fail("Metadata anggota atau progres belum dapat dimuat.");

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const progressByBook = new Map((progresses ?? []).map((progress) => [progress.book_id, Number(progress.percent)]));
  return Promise.all(rows.map(async (row) => {
    let coverUrl: string | null = null;
    if (row.cover_path) {
      const { data } = await supabase.storage.from("covers").createSignedUrl(row.cover_path, 60);
      coverUrl = data?.signedUrl ?? null;
    }
    const { file_path: _privatePath, cover_path: _coverPath, ...publicFields } = row;
    return {
      ...publicFields,
      progress: progressByBook.get(row.id) ?? 0,
      viewer_is_owner: row.owner_id === viewerId,
      owner: profileById.get(row.owner_id) ?? null,
      cover_url: coverUrl,
    };
  }));
}

export async function getShelfData(
  supabase: SupabaseClient<Database>,
  viewerId: string,
  filters: { view: ShelfView; status?: string; language?: string },
) {
  let query = supabase.from("books").select("*").order("created_at", { ascending: false });
  if (filters.view === "mine") query = query.eq("owner_id", viewerId);
  const { data, error } = await query;
  if (error) fail("Rak belum dapat dimuat.");

  const allRows = (data ?? []) as BookRow[];
  const languages = [...new Set(allRows.map((book) => book.language).filter(Boolean))].sort((a, b) => a.localeCompare(b, "id"));
  const rows = allRows.filter((book) =>
    (!filters.status || book.status === filters.status) &&
    (!filters.language || book.language === filters.language),
  );

  return { books: await enrichBooks(supabase, rows, viewerId), languages, total: rows.length, collectionTotal: allRows.length };
}

export async function getBookDetailData(
  supabase: SupabaseClient<Database>,
  viewerId: string,
  bookId: string,
): Promise<BookDetailData | null> {
  const { data: book, error } = await supabase.from("books").select("*").eq("id", bookId).maybeSingle();
  if (error) fail("Buku belum dapat dimuat.");
  if (!book) return null;

  const [{ data: allBooks, error: booksError }, { data: rawReviews, error: reviewsError }] = await Promise.all([
    supabase.from("books").select("id, owner_id, title, author, status, cover_path").order("created_at", { ascending: false }),
    supabase.from("reviews").select("id, book_id, author_id, body, created_at").eq("book_id", bookId).order("created_at", { ascending: true }),
  ]);
  if (booksError || reviewsError) fail("Detail buku belum dapat dimuat.");

  const profileIds = [...new Set([
    ...((allBooks ?? []).map((entry) => entry.owner_id)),
    ...((rawReviews ?? []).map((review) => review.author_id)),
  ])];
  const { data: profiles, error: profileError } = profileIds.length
    ? await supabase.from("profiles").select("id, display_name, initials, role").in("id", profileIds)
    : { data: [], error: null };
  if (profileError) fail("Profil anggota belum dapat dimuat.");
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const card = (await enrichBooks(supabase, [book as BookRow], viewerId))[0];
  const matchingBooks = await Promise.all((allBooks ?? [])
    .filter((entry) =>
      entry.owner_id !== viewerId &&
      entry.id !== bookId &&
      normalizeTitleAuthor(entry.title) === normalizeTitleAuthor(book.title) &&
      normalizeTitleAuthor(entry.author) === normalizeTitleAuthor(book.author),
    )
    .map(async (entry) => {
      let coverUrl: string | null = null;
      if (entry.cover_path) {
        const { data } = await supabase.storage.from("covers").createSignedUrl(entry.cover_path, 60);
        coverUrl = data?.signedUrl ?? null;
      }
      return {
        id: entry.id,
        title: entry.title,
        author: entry.author,
        status: entry.status,
        owner: profileById.get(entry.owner_id) ?? null,
        cover_url: coverUrl,
      };
    }));

  const reviews: ReviewView[] = ((rawReviews ?? []) as ReviewRow[]).map((review) => {
    const author = profileById.get(review.author_id);
    return {
      ...review,
      author_name: author?.display_name ?? "Anggota",
      author_initials: author?.initials ?? "A",
      viewer_is_author: review.author_id === viewerId,
    };
  });

  return { book: card, matchingBooks, reviews };
}

export async function getProgress(
  supabase: SupabaseClient<Database>,
  viewerId: string,
  bookId: string,
) {
  const { data, error } = await supabase.from("reading_progress")
    .select("user_id, book_id, locator, percent, updated_at")
    .eq("user_id", viewerId)
    .eq("book_id", bookId)
    .maybeSingle();
  if (error) fail("Progres membaca belum dapat dimuat.");
  return data as ReadingProgressRow | null;
}
