import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";

const publicPaths = new Set(["/login", "/auth/callback"]);

function loginRedirect(request: NextRequest, denied = false) {
  const target = new URL("/login", request.url);
  if (denied) target.searchParams.set("denied", "1");
  const response = NextResponse.redirect(target);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/auth/callback" || pathname.startsWith("/auth/callback/")) return NextResponse.next();

  if (!isSupabaseConfigured()) {
    if (pathname === "/login") return NextResponse.next();
    return loginRedirect(request);
  }

  const { url, key } = getSupabaseConfig();
  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) {
    if (publicPaths.has(pathname)) return response;
    return loginRedirect(request);
  }

  const { data: member, error: membershipError } = await supabase.rpc("is_member");
  if (membershipError || !member) {
    await supabase.auth.signOut();
    const denied = loginRedirect(request, true);
    for (const cookie of response.cookies.getAll()) denied.cookies.set(cookie);
    return denied;
  }

  if (pathname === "/login") return NextResponse.redirect(new URL("/", request.url));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|avif|ico)$).*)"],
};
