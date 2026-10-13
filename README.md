# Rak bersama

Rak bersama adalah arsip buku untuk membaca bersama. Siapa saja dapat membuat akun dengan email dan kata sandi; akun langsung aktif tanpa verifikasi email. Anggota dapat berbagi metadata, sampul, status membaca, dan catatan, sementara berkas EPUB/PDF hanya dapat dibuka pemiliknya.

## Prasyarat

- Node.js 20 atau lebih baru dan npm
- Proyek Supabase
- Docker Desktop dan Supabase CLI untuk pengujian database lokal

## Jalankan aplikasi

~~~sh
npm install
cp .env.example .env.local
npm run dev
~~~

Aplikasi tersedia di `http://localhost:3000`. Isi variabel Supabase di `.env.local` sebelum mencoba rute anggota. File `.env.local` tidak boleh di-commit.

## Siapkan Supabase hosted

1. Buat proyek Supabase dan catat URL, publishable key, dan service-role key.
2. Pastikan penyedia **Email** aktif di **Authentication → Providers** dan pendaftaran diizinkan. Aplikasi membuat akun terkonfirmasi melalui endpoint server sehingga tidak mengirim atau menunggu verifikasi email.
3. Terapkan migrasi dari root proyek:

   ~~~sh
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ~~~

   Migrasi membuat tabel, kebijakan RLS, dan bucket privat `books` serta `covers`; bucket tidak perlu dibuat lewat Dashboard.
4. Atur variabel berikut di hosting:

   ~~~dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   ADMIN_EMAIL=admin@domain-anda.id
   ~~~

   `SUPABASE_SERVICE_ROLE_KEY` hanya dibaca di server. Jangan beri awalan `NEXT_PUBLIC_` dan jangan kirim ke browser. `ADMIN_EMAIL` menentukan alamat yang dapat menerima role admin saat dibuat menggunakan kode pengelola awal.
5. Semua akun baru otomatis masuk ke daftar anggota agar dapat membuka rak. Hanya email pada `ADMIN_EMAIL` dengan kode pengelola sekali pakai yang mendapat role admin; akun lain menjadi anggota biasa. Informasi buku dan catatan bersama dapat dilihat seluruh anggota; file buku hanya dapat dibuka pemiliknya.

## Jalankan migrasi lokal dan tes

Docker harus aktif. Mulai Supabase lokal, lalu lihat kredensial lokal:

~~~sh
npx supabase start
npx supabase status -o env
npx supabase db reset
~~~

Isi `.env.local` dengan `API_URL`, `ANON_KEY`, dan `SERVICE_ROLE_KEY` yang dicetak CLI sebagai `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY`. Tambahkan `ADMIN_EMAIL=qa-member@example.test` untuk mode browser smoke lokal. Jangan salin kredensial lokal ke dokumentasi atau commit.

Unit test dan pemeriksaan tipe:

~~~sh
npm test
npm run typecheck
~~~

SQL RLS isolation test dijalankan terhadap database lokal:

~~~sh
npx supabase test db --local
~~~

Jika Docker Desktop tidak dapat memasang berkas tes ke container, jalankan SQL yang sama lewat stdin container database lokal (uji RLS ini membungkus seluruh fixture dengan transaksi dan rollback):

~~~sh
docker exec -i supabase_db_rak-bersama psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/tests/rls_isolation.test.sql
~~~

Browser smoke test memeriksa guard login, unggah EPUB/PDF Gutenberg, rak, baca, pemulihan posisi, dan penolakan tautan berkas oleh anggota lain. Persiapkan dua akun lokal dan cookie Playwright (tidak menggunakan Google atau akun hosted):

~~~sh
npm run test:e2e:prepare
npm run test:e2e
~~~

Untuk menyimpan tangkapan route login, rak, detail, edit, upload, undangan, dan reader pada lebar 1440 serta 390 piksel ke `docs/screenshots/`, jalankan `PLAYWRIGHT_CAPTURE_SCREENSHOTS=1 npm run test:e2e`.

Helper membuat anggota sementara `qa-member@example.test` dan `qa-member-b@example.test` hanya bila URL Supabase di `.env.local` menunjuk `localhost` atau `127.0.0.1`. Sesi tersimpan di `tests/e2e/.auth/`, diabaikan Git, dan menggunakan password acak. Helper ditolak untuk URL hosted. Pengujian browser menghapus buku uji setelah selesai.

Fixture EPUB/PDF berasal dari Project Gutenberg; tautan dan status domain publik dicatat di `tests/fixtures/README.md`. Tes unit EPUB memakai EPUB ZIP sintetis dan tidak disajikan oleh aplikasi.

## Deploy ke Vercel

1. Impor repository ke Vercel dan pertahankan build command `npm run build`.
2. Tambahkan `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, dan `ADMIN_EMAIL` pada environment Production. Isi Preview hanya bila preview akan dipakai.
3. Pastikan penyedia Email aktif di Supabase. Login dan pendaftaran email/password tidak memakai callback URL.
4. Setelah deploy, gunakan kode pengelola awal satu kali saat mendaftar dengan alamat `ADMIN_EMAIL`. Pendaftaran email lain tetap terbuka dan otomatis menjadi anggota biasa. Setelah akun admin berhasil dibuat, kode tidak dapat digunakan lagi.

## Batas dan privasi

- Batas berkas buku di aplikasi dan bucket adalah 50 MiB; sampul dibatasi 5 MiB.
- Bucket tidak publik. Tautan baca dibuat server-side setelah pemeriksaan kepemilikan dan berlaku paling lama 60 detik.
- Semua akun terdaftar dapat membaca metadata, sampul yang terdaftar, dan ulasan; progres serta berkas buku dibatasi ke pemilik.
- Reader EPUB menonaktifkan konten berskrip di iframe sandbox. PDF ditampilkan oleh pdf.js.
- Pendaftaran tidak memverifikasi kepemilikan alamat email. Semua akun baru mendapat akses sebagai anggota biasa; jangan menetapkan role admin hanya berdasarkan email yang dikirim pada pendaftaran terbuka.
- Kredit dan lisensi karya Klimt ada di `public/art/CREDITS.md`.
