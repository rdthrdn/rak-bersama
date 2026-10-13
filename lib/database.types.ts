export type ReadingStatus = "reading" | "finished" | "dropped" | "paused" | "unread";
export type BookFormat = "epub" | "pdf";
export type MemberRole = "member" | "admin";

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type ProfileRow = {
  id: string;
  display_name: string;
  initials: string;
  role: MemberRole;
};

export type BookRow = {
  id: string;
  owner_id: string;
  title: string;
  author: string;
  language: string;
  genre: string | null;
  year: number | null;
  pages: number | null;
  synopsis: string | null;
  status: ReadingStatus;
  format: BookFormat;
  file_path: string;
  cover_path: string | null;
  created_at: string;
};

export type ReadingProgressRow = {
  user_id: string;
  book_id: string;
  locator: Record<string, unknown>;
  percent: number;
  updated_at: string;
};

export type ReviewRow = {
  id: string;
  book_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, Pick<ProfileRow, "id" | "display_name" | "initials" | "role">>;
      allowed_emails: Table<{ email: string; created_at: string }, { email: string }, { email?: string }>;
      admin_bootstrap_codes: Table<
        { id: boolean; token_hash: string; consumed_at: string | null },
        { id?: boolean; token_hash: string; consumed_at?: string | null },
        { id?: boolean; token_hash?: string; consumed_at?: string | null }
      >;
      books: Table<BookRow, Omit<BookRow, "created_at"> & { created_at?: string }>;
      reading_progress: Table<ReadingProgressRow, Omit<ReadingProgressRow, "updated_at"> & { updated_at?: string }>;
      reviews: Table<ReviewRow, Omit<ReviewRow, "id" | "created_at"> & { id?: string; created_at?: string }>;
    };
    Views: Record<string, never>;
    Functions: {
      is_member: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type BookWithProgress = BookRow & {
  progress: number;
  viewer_is_owner: boolean;
  owner: Pick<ProfileRow, "id" | "display_name" | "initials">;
  cover_url: string | null;
};

export type BookCard = Omit<BookRow, "file_path" | "cover_path"> & {
  progress: number;
  viewer_is_owner: boolean;
  owner: Pick<ProfileRow, "id" | "display_name" | "initials"> | null;
  cover_url: string | null;
};

export type ReviewView = ReviewRow & {
  author_name: string;
  author_initials: string;
  viewer_is_author: boolean;
};
