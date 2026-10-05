# Pemeriksaan aplikasi Rak bersama

Hasil ini diisi setelah alur dapat dijalankan terhadap layanan lokal. `UNVERIFIED` berarti bukti lingkungan atau kredensial belum tersedia; status itu tidak ditafsirkan sebagai lulus.

## Pemeriksaan visual dan anti-slop

- [ ] Arah warna, typeface, copy, dan hierarki layar dibandingkan dengan referensi desain dan screenshot browser.
- [ ] Setidaknya lima titik dibandingkan: copy judul; bentuk rak/label; material dan pita seni; skala serta pasangan typeface; jarak dan layout pada layar kecil.
- [ ] Copy first viewport tetap berasal dari brief; tidak ada kicker/badge atau klaim baru.
- [ ] Semua route yang benar-benar dapat dibuka direkam di desktop 1440 dan ponsel 390.
- [ ] Pattern memakai motif Klimt parametrik; teks selalu berada di permukaan tenang.
- [ ] Tidak ada gradient ungu/biru, gradient teks, glow, glassmorphism, emoji, stok avatar, lorem ipsum, atau grid kartu generik.
- [ ] Kontrol memakai Newsreader/Cormorant, fokus emas terlihat, dan reduced motion dihormati.
- [ ] Reader mobile tidak menutupi teks dengan garis progres.

## Keamanan dan fungsi

- [ ] Route anggota mengarahkan pengunjung tanpa sesi ke `/login`.
- [ ] Hanya Google OAuth tersedia pada UI login.
- [ ] Callback memeriksa allowlist sebelum membuat profil; halaman undangan dibatasi ke admin.
- [ ] `is_member()` dipakai setiap policy tabel/storage; uji SQL memeriksa isolasi anggota dan non-anggota.
- [ ] File buku dan sampul memakai bucket privat; endpoint file memeriksa pemilik dan membuat URL maksimal 60 detik.
- [ ] Unggah membatasi ukuran/jenis dan memvalidasi magic bytes di klien dan server; metadata EPUB dibaca dari OPF.
- [ ] EPUB berada di iframe sandbox tanpa scripted content; PDF dirender oleh pdf.js.
- [ ] Progres terpisah per pemilik, di-debounce, dan resume setelah reload.
- [ ] Service-role key hanya di server; `.env.local` tidak dilacak; bundle produksi diperiksa.
- [ ] Unit, typecheck, build, SQL RLS, dan browser smoke dicatat dengan hasil yang benar-benar dijalankan.
