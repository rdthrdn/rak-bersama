import Link from "next/link";
import { AllowlistManager } from "@/components/allowlist-manager";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin.from("allowed_emails").select("email, created_at").order("created_at");

  return (
    <main className="admin-page page-shell">
      <header className="simple-header">
        <Link href="/" className="back-link">← Kembali ke rak</Link>
        <a href="/" className="wordmark">Rak <em>bersama</em></a>
      </header>
      <section className="admin-content">
        <h1>Daftar <em>undangan</em></h1>
        <p className="admin-lede">Hanya alamat yang tercantum di sini dapat membuka arsip.</p>
        {error ? (
          <p className="state-message" role="alert">Daftar anggota belum dapat dimuat.</p>
        ) : (
          <AllowlistManager emails={(data ?? []).map((row) => row.email)} />
        )}
      </section>
    </main>
  );
}
