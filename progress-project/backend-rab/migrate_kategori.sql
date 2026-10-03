-- Migrasi manual: tambahkan kolom kategori pada tabel submissions.
-- Jalankan sekali pada database db_verifikasi_rab (PostgreSQL).
--
-- Dipakai karena backend memakai SQLAlchemy create_all() yang TIDAK
-- menambahkan kolom baru ke tabel yang sudah ada.

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS kategori VARCHAR(100);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS kategori_deskripsi TEXT;

-- Verifikasi:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'submissions' AND column_name LIKE 'kategori%';