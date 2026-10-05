# Rak bersama

Rak bersama adalah arsip buku privat untuk kelompok kecil. Anggota yang diundang dapat berbagi metadata, sampul, status membaca, dan catatan; berkas EPUB/PDF hanya dapat dibuka pemiliknya. UI masuk memakai Google OAuth saja.

## Prasyarat

- Node.js 20 atau lebih baru dan npm
- Proyek Supabase
- Google OAuth client untuk penggunaan hosted
- Docker Desktop dan Supabase CLI untuk pengujian database lokal

## Jalankan aplikasi

~~~sh
npm install
cp .env.example .env.local
npm run dev
~~~

Aplikasi tersedia di `http://localhost:3000`. Isi variabel Supabase di `.env.local` sebelum mencoba rute anggota. File `.env.local` tidak boleh di-commit.

## Siapkan Supabase hosted

1. Buat proyek Supabase dan catat project ref, URL, anon/publishable key, dan service-role key.
2. Di Google Cloud Console, buat OAuth client tipe Web. Tambahkan URI callback milik Supabase, `https://<project-ref>.supabase.co/auth/v1/callback`, ke **Authorized redirect URIs** Google.
3. Di Supabase **Authentication → Providers → Google**, aktifkan Google lalu masukkan client ID dan secret dari Google Cloud.
4. Di Supabase **Authentication → URL Configuration**, set Site URL ke origin produksi. Tambahkan callback aplikasi berikut ke **Redirect URLs**: `http://localhost:3000/auth/callback`, `http://127.0.0.1:3000/auth/callback`, dan `https://<domain-produksi>/auth/callback`. Tambahkan origin preview Vercel hanya jika preview tersebut memang akan dipakai untuk uji login.
5. Terapkan kedua migrasi dari root proyek:

   ~~~sh
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ~~~

   Migrasi membuat tabel, kebijakan RLS, dan bucket privat `books` serta `covers`; bucket tidak perlu dibuat lewat Dashboard.
6. Sebelum login admin pertama, masukkan email yang sama persis dengan `ADMIN_EMAIL` ke allowlist melalui SQL Editor:

   ~~~sql
   insert into public.allowed_emails (email)
   values (lower('admin@domain-anda.id'))
   on conflict (email) do nothing;
   ~~~

7. Isi `.env.local` dengan URL/key proyek dan email admin:

   ~~~dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-atau-publishable-key>
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   ADMIN_EMAIL=admin@domain-anda.id
   ~~~

   `SUPABASE_SERVICE_ROLE_KEY` hanya dibaca di server. Jangan beri awalan `NEXT_PUBLIC_` dan jangan kirim ke browser.
8. Setelah Google login pertama, profil admin dibuat otomatis. Admin dapat menambah dan menghapus undangan lewat halaman **Undangan**.

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
2. Tambahkan `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (atau `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`), `SUPABASE_SERVICE_ROLE_KEY`, dan `ADMIN_EMAIL` pada environment Production. Isi Preview hanya bila preview akan dipakai.
3. Pastikan Google OAuth tetap memakai callback Supabase `https://<project-ref>.supabase.co/auth/v1/callback`; tambahkan URL callback aplikasi Vercel produksi ke Supabase Redirect URLs.
4. Tambahkan email admin ke `public.allowed_emails` sebelum login pertamanya. Setelah deploy, uji masuk, undangan, unggah, serta buka EPUB dan PDF dengan anggota yang diizinkan.

## Batas dan privasi

- Batas berkas buku di aplikasi dan bucket adalah 50 MiB; sampul dibatasi 5 MiB.
- Bucket tidak publik. Tautan baca dibuat server-side setelah pemeriksaan kepemilikan dan berlaku paling lama 60 detik.
- Anggota dapat membaca metadata, sampul yang terdaftar, dan ulasan; progres serta berkas buku dibatasi ke pemilik.
- Reader EPUB menonaktifkan konten berskrip di iframe sandbox. PDF ditampilkan oleh pdf.js.
- OAuth live dan redirect Google memerlukan kredensial proyek sendiri; akun lokal browser-test tidak menguji provider Google.
- Kredit dan lisensi karya Klimt ada di `public/art/CREDITS.md`.
