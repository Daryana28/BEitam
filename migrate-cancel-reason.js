// be/migrate-cancel-reason.js
// Jalankan sekali: node migrate-cancel-reason.js

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const envRaw = readFileSync(resolve(__dir, '.env'), 'utf-8');
envRaw.split(/\r?\n/).forEach(line => {
  const t = line.trim();
  if (!t || t.startsWith('#')) return;
  const idx = t.indexOf('=');
  if (idx < 0) return;
  const key = t.slice(0, idx).trim();
  const val = t.slice(idx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
});

import { Sequelize } from 'sequelize';

const seq = new Sequelize(
  process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 1433),
    dialect: 'mssql',
    dialectOptions: { options: { encrypt: false, trustServerCertificate: true } },
    logging: false,
  }
);

async function run() {
  await seq.authenticate();
  console.log('✅ DB connected');

  // Cek apakah kolom sudah ada
  const [cols] = await seq.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'maintenance_schedules' AND COLUMN_NAME = 'cancel_reason'
  `);

  if (cols.length > 0) {
    console.log('ℹ️  Kolom cancel_reason sudah ada, tidak perlu migrasi.');
    process.exit(0);
  }

  await seq.query(`
    ALTER TABLE maintenance_schedules
    ADD cancel_reason NVARCHAR(500) NULL
  `);
  console.log('✅ Kolom cancel_reason berhasil ditambahkan ke maintenance_schedules.');
  process.exit(0);
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
