-- 003: upgrade tabel products lama (dibuat sebelum ada fitur kategori)
-- MySQL tidak punya "ADD COLUMN IF NOT EXISTS", jadi keberadaan kolom
-- dan foreign key dicek dulu lewat information_schema. Kalau sudah ada,
-- query-nya jadi "DO 0" (tidak melakukan apa-apa).

SET @ada_kolom := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'category_id'
);

SET @sql := IF(@ada_kolom = 0,
  'ALTER TABLE products ADD COLUMN category_id INT NULL AFTER price',
  'DO 0');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ada_fk := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND CONSTRAINT_NAME = 'fk_products_category'
);

SET @sql := IF(@ada_fk = 0,
  'ALTER TABLE products ADD CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL',
  'DO 0');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
