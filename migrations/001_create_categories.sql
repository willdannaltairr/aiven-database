-- 001: tabel kategori
-- Dipakai untuk mengelompokkan produk.
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);
