import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2)).toUpperCase().slice(0, 3);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login?error=oauth", request.url));

  let authResponse: NextResponse | null = null;
  try {
    const { url, key } = getSupabaseConfig();
    const response = NextResponse.redirect(new URL("/", request.url));
    authResponse = response;
    const redirectWithCookies = (path: string) => {
      const redirectResponse = NextResponse.redirect(new URL(path, request.url));
      for (const cookie of response.cookies.getAll()) redirectResponse.cookies.set(cookie);
      return redirectResponse;
    };
    const supabase = createServerClient<Database>(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
            request.cookies.set(name, value);
          }
        },
      },
    });
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user?.email) {
      await supabase.auth.signOut();
      return redirectWithCookies("/login?error=oauth");
    }

    const email = data.user.email.trim().toLowerCase();
    const admin = createAdminClient();
    const { data: allowed, error: allowlistError } = await admin
      .from("allowed_emails")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (allowlistError) {
      await supabase.auth.signOut();
      return redirectWithCookies("/login?setup=1");
    }
    if (!allowed) {
      await supabase.auth.signOut();
      return redirectWithCookies("/login?denied=1");
    }

    const displayName =
      data.user.user_metadata?.full_name?.toString().trim() ||
      data.user.user_metadata?.name?.toString().trim() ||
      email.split("@")[0];
    const configuredAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: data.user.id,
        display_name: displayName.slice(0, 120),
        initials: initialsFor(displayName),
        role: configuredAdmin === email ? "admin" : "member",
      },
      { onConflict: "id" },
    );
    if (profileError) {
      await supabase.auth.signOut();
      return redirectWithCookies("/login?setup=1");
    }

    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    const fallback = NextResponse.redirect(new URL("/login?setup=1", request.url));
    if (authResponse) for (const cookie of authResponse.cookies.getAll()) fallback.cookies.set(cookie);
    return fallback;
  }
}
