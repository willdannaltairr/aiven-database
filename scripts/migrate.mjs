// Menjalankan semua file .sql di folder migrations/ secara berurutan.
//
// File yang sudah pernah dijalankan dicatat di tabel `schema_migrations`,
// jadi migration yang sama tidak dijalankan dua kali.
//
// Pakai: npm run db:migrate
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

// Baca .env.local kalau variabel DB belum ada di environment.
if (!process.env.DB_HOST) {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (match) process.env[match[1]] ??= match[2];
    }
  }
}

const migrationsDir = path.join(process.cwd(), 'migrations');

const ssl = process.env.DB_CA_CERT
  ? {
      ca: Buffer.from(process.env.DB_CA_CERT, 'base64').toString('utf-8'),
      rejectUnauthorized: false,
    }
  : undefined;

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl,
  multipleStatements: true,
});

// Tabel penanda migration yang sudah jalan.
await connection.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

const [rows] = await connection.query('SELECT id FROM schema_migrations');
const sudahJalan = new Set(rows.map((row) => row.id));

const files = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort();

for (const file of files) {
  if (sudahJalan.has(file)) {
    console.log(`skip     ${file}`);
    continue;
  }

  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

  try {
    await connection.query(sql);
    await connection.query('INSERT INTO schema_migrations (id) VALUES (?)', [file]);
    console.log(`applied  ${file}`);
  } catch (error) {
    console.error(`gagal    ${file}`);
    console.error(error.message);
    await connection.end();
    process.exit(1);
  }
}

await connection.end();
console.log('Migration selesai.');
