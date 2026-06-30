// be/check-asset-category.js
// Jalankan dari folder be/: node check-asset-category.js

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Parse .env manual (hindari masalah CRLF & library conflict)
const __dir = dirname(fileURLToPath(import.meta.url));
const envRaw = readFileSync(resolve(__dir, '.env'), 'utf-8');
envRaw.split(/\r?\n/).forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const idx = trimmed.indexOf('=');
  if (idx < 0) return;
  const key = trimmed.slice(0, idx).trim();
  const val = trimmed.slice(idx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
});

import { Sequelize } from 'sequelize';

const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = process.env;

console.log(`🔌 Connecting to ${DB_HOST}:${DB_PORT} / ${DB_NAME} as ${DB_USER}`);

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: Number(DB_PORT || 1433),
  dialect: 'mssql',
  dialectOptions: {
    options: { encrypt: false, trustServerCertificate: true },
  },
  logging: false,
});

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected\n');

    // 1. Asset dengan category_id tidak valid (orphan)
    const orphanAssets = await sequelize.query(`
      SELECT a.asset_id, a.asset_code, a.asset_name, a.category_id
      FROM assets a
      LEFT JOIN asset_categories ac ON a.category_id = ac.category_id
      WHERE ac.category_id IS NULL
      ORDER BY a.asset_id
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log(`=== ASSET DENGAN category_id TIDAK VALID (${orphanAssets.length} data) ===`);
    if (orphanAssets.length === 0) {
      console.log('Semua asset memiliki category_id yang valid.\n');
    } else {
      console.table(orphanAssets);
    }

    // 2. Kategori tidak digunakan asset manapun
    const unusedCats = await sequelize.query(`
      SELECT ac.category_id, ac.category_name, ac.parent_id, ac.level_no, ac.is_active
      FROM asset_categories ac
      LEFT JOIN assets a ON a.category_id = ac.category_id
      WHERE a.asset_id IS NULL
      ORDER BY ac.level_no, ac.category_name
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log(`=== KATEGORI TIDAK DIGUNAKAN ASSET MANAPUN (${unusedCats.length} data) ===`);
    if (unusedCats.length === 0) {
      console.log('Semua kategori digunakan minimal 1 asset.\n');
    } else {
      console.table(unusedCats);
    }

    // 3. Distribusi jumlah asset per kategori
    const dist = await sequelize.query(`
      SELECT 
        ac.category_id,
        ac.category_name,
        ac.level_no,
        COUNT(a.asset_id) AS jumlah_asset
      FROM asset_categories ac
      LEFT JOIN assets a ON a.category_id = ac.category_id
      GROUP BY ac.category_id, ac.category_name, ac.level_no
      ORDER BY jumlah_asset DESC
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log(`=== DISTRIBUSI ASSET PER KATEGORI ===`);
    console.table(dist);

    // 4. Summary
    const [[{ total: totalAsset }]] = await sequelize.query(`SELECT COUNT(*) AS total FROM assets`);
    const [[{ total: totalCat }]] = await sequelize.query(`SELECT COUNT(*) AS total FROM asset_categories`);

    console.log(`\n📊 SUMMARY`);
    console.log(`   Total asset         : ${totalAsset}`);
    console.log(`   Total kategori      : ${totalCat}`);
    console.log(`   Asset orphan (error): ${orphanAssets.length}`);
    console.log(`   Kategori tidak pakai: ${unusedCats.length}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
