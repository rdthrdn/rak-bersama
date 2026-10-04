"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getSupabaseConfig } from "@/lib/supabase/config";

let browserClient: SupabaseClient<Database> | undefined;

export function createClient() {
  if (!browserClient) {
    const { url, key } = getSupabaseConfig();
    browserClient = createBrowserClient<Database>(url, key);
  }
  return browserClient;
}
