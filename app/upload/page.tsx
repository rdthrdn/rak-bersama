import Link from "next/link";
import { UploadWorkbench } from "@/components/upload-workbench";
import { requireMember } from "@/lib/auth";

export default async function UploadPage() {
  const { profile } = await requireMember();
  return (
    <main className="upload-page page-shell">
      <header className="simple-header">
        <Link href="/" className="back-link">← Kembali ke rak</Link>
        <a href="/" className="wordmark">Rak <em>bersama</em></a>
        <span className="member-avatar" aria-label={profile.display_name}>{profile.initials}</span>
      </header>
      <section className="upload-content">
        <h1>Simpan sebuah <em>buku</em></h1>
        <p className="upload-intro">Berkas buku hanya dapat dibuka oleh pemiliknya. Anggota lain melihat metadata, sampul, status, dan ulasan.</p>
        <UploadWorkbench />
      </section>
    </main>
  );
}
