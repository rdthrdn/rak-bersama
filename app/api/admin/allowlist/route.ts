import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "Akses tidak tersedia." }, { status: 403 });
  const input = (await request.json().catch(() => null)) as { action?: string; email?: string } | null;
  const email = input?.email?.trim().toLowerCase() ?? "";
  if (!emailPattern.test(email) || email.length > 254 || !["add", "remove"].includes(input?.action ?? "")) {
    return NextResponse.json({ error: "Periksa alamat email dan tindakan." }, { status: 400 });
  }

  const protectedAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (input?.action === "remove" && email === protectedAdmin) {
    return NextResponse.json({ error: "Alamat pengelola utama tidak dapat dihapus dari halaman ini." }, { status: 400 });
  }

  const admin = createAdminClient();
  const result = input?.action === "add"
    ? await admin.from("allowed_emails").upsert({ email }, { onConflict: "email", ignoreDuplicates: true })
    : await admin.from("allowed_emails").delete().eq("email", email);
  if (result.error) return NextResponse.json({ error: "Perubahan belum tersimpan." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
