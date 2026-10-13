# Pemeriksaan aplikasi Rak bersama

Status: `LULUS` berarti ada bukti dari tes atau tinjauan kode yang disebutkan; `SEBAGIAN` berarti buktinya belum lengkap; `BELUM DIVERIFIKASI` berarti belum ada bukti yang cukup. Build, unit test, browser smoke, dan tes RLS lokal selesai pada 13 Oktober 2026. Login Google hosted dan deploy Vercel belum dapat diuji tanpa konfigurasi proyek.

## Pemeriksaan visual dan anti-slop

- [LULUS — screenshot dan tinjauan visual] Dua puluh empat screenshot mencakup 12 keadaan login, rak, upload, detail, admin, dan reader pada lebar 1440 serta 390 piksel. Tinjauan sampel mencakup rak personal/shared, detail owner/shared, upload metadata, dan reader EPUB/PDF di desktop dan ponsel.
- [LULUS — tinjauan visual] Login mempertahankan copy ringkas, palet, artwork, pasangan serif, hierarki, dan susunan layar kecil sesuai referensi.
- [LULUS — tinjauan kode] `components/patterns/klimt-pattern.tsx` memakai enam motif mosaik, medali, bunga, garis, pohon, dan ubin; konten bacaan memiliki permukaan tenang.
- [LULUS — tinjauan kode] Tidak ditemukan gradient teks, glassmorphism, glow, emoji, font sans generik, kartu dashboard seragam, atau warna Tailwind default pada UI; gradient yang ada hanya mask pudar dan garis tipis di chrome.
- [LULUS — tinjauan kode dan screenshot] Cormorant Garamond dan Newsreader dimuat dari aset lokal; fokus memakai ring emas dan `prefers-reduced-motion` mematikan gerak panjang. Tautan EPUB mengikuti warna tema.
- [LULUS — screenshot ponsel] Garis progres reader berada di bawah navigasi dan di luar bidang teks untuk EPUB maupun PDF.

## Keamanan dan fungsi

- [LULUS — browser smoke] Pengunjung tanpa sesi diarahkan ke login; sesi anggota dapat membuka rak dan detail sesuai izin.
- [LULUS — tinjauan kode] Tombol login hanya menawarkan Google OAuth.
- [LULUS — tinjauan kode] Callback memeriksa email allowlist sebelum membuat profil; halaman pengelolaan undangan dibatasi ke admin. Alur OAuth Google hosted belum diuji.
- [LULUS — tes SQL lokal] `is_member()` dipakai pada policy tabel dan storage; seluruh 15 assertion isolasi RLS lulus, termasuk akses sampul tertunda milik sendiri dan penolakannya bagi anggota lain.
- [LULUS — tinjauan kode dan browser smoke] Bucket buku dan sampul privat; endpoint file memeriksa pemilik/path dan membuat signed URL 60 detik. Browser smoke mengonfirmasi anggota lain mendapat 403 tanpa URL file.
- [LULUS — unit test dan browser smoke] Upload memeriksa ukuran dan magic bytes; EPUB membaca metadata OPF. Alur upload EPUB dan PDF lulus.
- [LULUS — tinjauan kode dan browser smoke] EPUB dibuka dalam iframe sandbox tanpa scripted content; PDF dirender oleh pdf.js.
- [LULUS — browser smoke] Progress EPUB dan PDF disimpan per anggota dan pulih setelah reload; tes juga membuka TOC EPUB dan berpindah halaman PDF.
- [LULUS — tinjauan bundle/repo] Service-role key tidak ditemukan di bundle klien; `.env.local` diabaikan Git dan `.env.example` tersedia.
- [LULUS — verifikasi lokal] Build produksi dan typecheck lulus; unit test 9/9; tes isolasi RLS 15/15; browser smoke 2/2.

## Belum diverifikasi

- [BELUM DIVERIFIKASI — perlu konfigurasi proyek] Login Google OAuth hosted, callback di domain produksi, dan deploy Vercel. Kredensial serta konfigurasi proyek hosted belum tersedia untuk sesi QA ini.
