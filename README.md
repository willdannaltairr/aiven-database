# CRUD Produk — Next.js + MySQL (Aiven) + Vercel

Aplikasi CRUD sederhana (Create, Read, Update, Delete) untuk data "produk",
dibangun dengan Next.js App Router dan database MySQL, siap deploy ke Vercel
dengan database di Aiven.

## Struktur Project

```
app/
  api/products/route.js         -> GET (list), POST (create)
  api/products/[id]/route.js    -> GET (detail), PUT (update), DELETE
  api/categories/route.js       -> GET (list), POST (create)
  api/categories/[id]/route.js  -> PUT (update), DELETE
  page.js                       -> Halaman utama (tabel + form + filter kategori)
  layout.js
  globals.css
lib/
  db.js                         -> Koneksi pool MySQL (support SSL Aiven)
migrations/
  001_create_categories.sql     -> Tabel `categories`
  002_create_products.sql       -> Tabel `products` (relasi ke categories)
  003_add_category_to_products.sql -> Kolom + FK category_id untuk tabel lama
scripts/
  migrate.mjs                   -> Runner migration (npm run db:migrate)
schema.sql                      -> Skema lengkap (referensi; setup pakai migration)
.env.local.example              -> Contoh environment variables
```

## 1. Buat Database di Aiven

1. Login ke https://aiven.io lalu buat service baru → pilih **MySQL** → plan **Free**.
2. Pilih region terdekat, tunggu status menjadi "Running".
3. Buka tab **Overview**, catat: `Host`, `Port`, `User` (biasanya `avnadmin`), `Password`, `Database name` (default `defaultdb`).
4. Download **CA Certificate** (`ca.pem`) dari halaman yang sama.
5. Jalankan migration untuk membuat tabelnya (lihat bagian **Migration Database** di bawah).

## 2. Setup Project Secara Lokal

```bash
npm install
cp .env.local.example .env.local
```

Isi `.env.local` dengan kredensial Aiven kamu:

```
DB_HOST=your-service.aivencloud.com
DB_PORT=xxxxx
DB_USER=avnadmin
DB_PASSWORD=xxxxx
DB_NAME=defaultdb
DB_CA_CERT=<base64 dari ca.pem>
```

Generate nilai `DB_CA_CERT` dari file `ca.pem` yang tadi didownload:

```bash
base64 -i ca.pem | tr -d '\n'
```

Copy hasilnya (satu baris panjang) ke `.env.local`.

Jalankan secara lokal:

```bash
npm run dev
```

Buka http://localhost:3000 — kamu akan melihat form tambah produk, tabel daftar produk, dan filter kategori.

## 3. Migration Database

Skema database dikelola lewat file SQL di folder `migrations/`. Setiap file yang sudah
pernah dijalankan dicatat di tabel `schema_migrations`, jadi migration aman dijalankan berulang.

Pastikan `.env.local` sudah terisi (langkah 2 di atas) — script membaca file itu otomatis.

```bash
npm run db:migrate
```

Hasilnya:

```text
applied  001_create_categories.sql
applied  002_create_products.sql
applied  003_add_category_to_products.sql
Migration selesai.
```

Kalau dijalankan lagi, file yang sudah pernah jalan akan dilewati:

```text
skip     001_create_categories.sql
skip     002_create_products.sql
skip     003_add_category_to_products.sql
Migration selesai.
```

Menambah tabel/kolom baru: buat file baru di `migrations/` dengan nomor urut berikutnya
(misal `004_tambah_stok.sql`), lalu jalankan `npm run db:migrate` lagi. Jangan mengubah
file migration yang sudah pernah dijalankan — buat file baru.

Kalau ada file yang gagal, script berhenti dengan exit code 1 dan nama file yang bermasalah:

```text
applied  001_create_categories.sql
applied  002_create_products.sql
applied  003_add_category_to_products.sql
gagal    004_tambah_stok.sql
Duplicate column name 'jumlah'
```

File yang gagal tidak dicatat di `schema_migrations`, jadi bisa diperbaiki lalu dijalankan ulang.

## 4. Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit: CRUD produk Next.js + MySQL"
git branch -M main
git remote add origin https://github.com/username/nama-repo.git
git push -u origin main
```

Pastikan `.env.local` **tidak** ikut ter-commit (sudah otomatis diabaikan lewat `.gitignore`).

## 5. Deploy ke Vercel

1. Login ke https://vercel.com dengan akun GitHub.
2. Klik **Add New → Project**, pilih repo yang baru saja di-push.
3. Di bagian **Environment Variables**, tambahkan variabel yang sama persis seperti di `.env.local`:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `DB_CA_CERT`
4. Klik **Deploy**.
5. Setelah selesai, buka URL yang diberikan Vercel (`https://nama-project.vercel.app`) — aplikasi CRUD sudah bisa dipakai.

**Migration tidak jalan otomatis saat deploy.** Vercel hanya menjalankan `next build`, bukan
`db:migrate`. Jalankan sekali dari komputermu, dengan `.env.local` yang menunjuk ke database
production:

```bash
npm run db:migrate
```

Kalau database production-nya beda dengan yang lokal, isi `.env.local` dengan kredensial
production dulu, jalankan migration, lalu kembalikan ke kredensial lokal. Cara lain: set
variabel `DB_*` langsung di terminal sebelum menjalankan script.

## Fitur

- **Create**: tambah produk baru lewat form (nama, deskripsi, harga, kategori)
- **Read**: daftar semua produk otomatis dimuat saat halaman dibuka
- **Update**: klik "Edit" pada baris produk untuk mengubah data
- **Delete**: klik "Hapus" untuk menghapus produk (dengan konfirmasi)
- **Kategori**: tambah/hapus kategori, pilih kategori saat menyimpan produk, dan filter tabel berdasarkan kategori

## Catatan

- Free tier Aiven MySQL bisa nonaktif otomatis setelah periode idle tertentu — kamu akan mendapat notifikasi email sebelum itu terjadi.
- Untuk mengubah skema database, tambahkan file baru di `migrations/` lalu jalankan `npm run db:migrate`.
- Untuk validasi input yang lebih ketat atau autentikasi (login admin), beri tahu saya — bisa ditambahkan.
