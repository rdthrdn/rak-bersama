import { EmailPasswordForm } from "@/components/email-password-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; setup?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="login-page">
      <div className="login-ornament" aria-hidden="true" />
      <section className="login-card" aria-labelledby="login-title">
        <a href="/login" className="wordmark">Rak <em>bersama</em></a>
        <div className="login-copy">
          <h1 id="login-title">Ruang baca <em>bersama</em></h1>
          <p>Masuk atau buat akun untuk melihat dan berbagi rak buku.</p>
        </div>
        {params.error && <p className="form-message" role="alert">Proses akun belum berhasil. Periksa email dan kata sandi lalu coba lagi.</p>}
        {params.setup === "1" && <p className="form-message" role="alert">Sambungan arsip belum siap. Periksa pengaturan Supabase.</p>}
        <EmailPasswordForm enabled={isSupabaseConfigured()} />
        <footer className="login-footer">Rak buku bersama · Email dan kata sandi</footer>
      </section>
    </main>
  );
}
