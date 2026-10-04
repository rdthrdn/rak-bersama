import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProfileRow } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type MemberContext = {
  supabase: SupabaseClient<Database>;
  user: User;
  profile: ProfileRow;
};

export async function getMemberContext(): Promise<MemberContext | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) return null;

  const { data: member, error: memberError } = await supabase.rpc("is_member");
  if (memberError || !member) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, initials, role")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || !profile) return null;

  return { supabase, user, profile };
}

export async function requireMember() {
  const context = await getMemberContext();
  if (!context) redirect("/login");
  return context;
}

export async function requireAdmin() {
  const context = await getMemberContext();
  if (!context) redirect("/login");

  const configuredAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!configuredAdmin || context.user.email?.toLowerCase() !== configuredAdmin || context.profile.role !== "admin") {
    redirect("/");
  }

  return context;
}

export async function isAdminRequest() {
  const context = await getMemberContext();
  const configuredAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(
    context &&
      configuredAdmin &&
      context.user.email?.toLowerCase() === configuredAdmin &&
      context.profile.role === "admin",
  );
}
