import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2)).toUpperCase().slice(0, 3);
}

export async function POST(request: NextRequest) {
  const input = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
    displayName?: string;
    adminSetupCode?: string;
  } | null;
  const email = input?.email?.trim().toLowerCase() ?? "";
  const password = input?.password ?? "";
  const displayName = input?.displayName?.trim() ?? "";
  const setupCode = input?.adminSetupCode?.trim() ?? "";

  if (!emailPattern.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Masukkan alamat email yang valid." }, { status: 400 });
  }
  if (password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: "Kata sandi harus berisi 8 sampai 128 karakter." }, { status: 400 });
  }
  if (displayName.length < 1 || displayName.length > 80) {
    return NextResponse.json({ error: "Nama tampilan harus berisi 1 sampai 80 karakter." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const configuredAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const isAdminRegistration = configuredAdmin === email;
    const setupCodeHash = isAdminRegistration && /^[a-f0-9]{64}$/i.test(setupCode)
      ? createHash("sha256").update(setupCode, "utf8").digest("hex")
      : null;

    if (isAdminRegistration) {
      if (!setupCodeHash) {
        return NextResponse.json({ error: "Kode pengelola awal belum benar." }, { status: 403 });
      }

      const { data: setupCodeRow, error: setupCodeError } = await admin
        .from("admin_bootstrap_codes")
        .select("id")
        .eq("id", true)
        .eq("token_hash", setupCodeHash)
        .is("consumed_at", null)
        .maybeSingle();

      if (setupCodeError) return NextResponse.json({ error: "Kode pengelola belum dapat diperiksa." }, { status: 503 });
      if (!setupCodeRow) return NextResponse.json({ error: "Kode pengelola tidak valid atau sudah digunakan." }, { status: 403 });
    }

    const { data, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: displayName },
    });
    if (createError || !data.user) {
      return NextResponse.json({ error: "Akun belum dapat dibuat. Jika sudah pernah mendaftar, silakan masuk." }, { status: 409 });
    }

    const { error: membershipError } = await admin
      .from("allowed_emails")
      .upsert({ email }, { onConflict: "email", ignoreDuplicates: true });
    if (membershipError) {
      await admin.auth.admin.deleteUser(data.user.id);
      return NextResponse.json({ error: "Keanggotaan belum dapat disiapkan. Coba lagi." }, { status: 503 });
    }

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: data.user.id,
        display_name: displayName,
        initials: initialsFor(displayName),
        // Public signups stay members; the configured admin needs a one-time bootstrap code.
        role: isAdminRegistration ? "admin" : "member",
      },
      { onConflict: "id" },
    );

    if (profileError) {
      await admin.auth.admin.deleteUser(data.user.id);
      return NextResponse.json({ error: "Profil akun belum dapat disiapkan. Coba lagi." }, { status: 503 });
    }

    if (isAdminRegistration && setupCodeHash) {
      const { data: consumedCode, error: consumeError } = await admin
        .from("admin_bootstrap_codes")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", true)
        .eq("token_hash", setupCodeHash)
        .is("consumed_at", null)
        .select("id")
        .maybeSingle();

      if (consumeError || !consumedCode) {
        await admin.auth.admin.deleteUser(data.user.id);
        return NextResponse.json({ error: "Kode pengelola sudah digunakan. Coba daftar lagi." }, { status: 409 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Layanan akun belum siap. Periksa konfigurasi Supabase." }, { status: 503 });
  }
}
