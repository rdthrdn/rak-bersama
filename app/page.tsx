import { Shelf, ShelfError } from "@/components/shelf";
import { requireMember } from "@/lib/auth";
import { getShelfData } from "@/lib/book-repository";
import type { ReadingStatus } from "@/lib/database.types";

export const dynamic = "force-dynamic";

const statuses = new Set<ReadingStatus>(["reading", "finished", "dropped", "paused", "unread"]);

export default async function HomePage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await requireMember();
  const params = await searchParams;
  const viewParam = Array.isArray(params.view) ? params.view[0] : params.view;
  const statusParam = Array.isArray(params.status) ? params.status[0] : params.status;
  const languageParam = Array.isArray(params.language) ? params.language[0] : params.language;
  const view = viewParam === "shared" ? "shared" : "mine";
  const status = statusParam && statuses.has(statusParam as ReadingStatus) ? statusParam as ReadingStatus : "";
  const language = languageParam?.trim() || "";

  try {
    const shelf = await getShelfData(context.supabase, context.user.id, { view, status, language });
    return <Shelf books={shelf.books} languages={shelf.languages} total={shelf.total} collectionTotal={shelf.collectionTotal} view={view} status={status} language={language} member={context.profile} />;
  } catch {
    return <ShelfError member={context.profile} />;
  }
}
