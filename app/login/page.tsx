import { LoginButton } from "@/components/login-button";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string; error?: string; setup?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="login-page">
      <div className="login-ornament" aria-hidden="true" />
      <section className="login-card" aria-labelledby="login-title">
        <a href="/login" className="wordmark">Rak <em>bersama</em></a>
        {params.denied === "1" ? (
          <div className="login-copy" role="status">
            <h1 id="login-title">Akses <em>belum</em> diberikan</h1>
            <p>Email ini belum tercantum dalam daftar anggota. Hubungi pengelola arsip untuk meminta undangan.</p>
          </div>
        ) : (
          <div className="login-copy">
            <h1 id="login-title">Ruang baca <em>kecil</em></h1>
            <p>Masuk dengan akun Google yang telah diundang untuk membuka rak bersama.</p>
          </div>
        )}
        {params.error && <p className="form-message" role="alert">Proses masuk belum berhasil. Silakan coba lagi.</p>}
        {params.setup === "1" && <p className="form-message" role="alert">Sambungan arsip belum siap. Periksa pengaturan Supabase.</p>}
        {params.denied !== "1" && (
          <LoginButton enabled={isSupabaseConfigured()} />
        )}
        <footer className="login-footer">Arsip baca pribadi · Akses melalui undangan</footer>
      </section>
    </main>
  );
}
