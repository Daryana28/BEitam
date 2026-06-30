// be/check-sm-vs-asset-cat.js
// Cek standar maintenance yg kategori/subKategorinya tidak match asset_categories
// Jalankan: node check-sm-vs-asset-cat.js

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
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 1433),
    dialect: 'mssql',
    dialectOptions: { options: { encrypt: false, trustServerCertificate: true } },
    logging: false,
  }
);

async function run() {
  await seq.authenticate();
  console.log('✅ DB connected\n');

  // Ambil semua asset_categories (lowercase untuk matching)
  const cats = await seq.query(
    `SELECT category_id, category_name FROM asset_categories`,
    { type: Sequelize.QueryTypes.SELECT }
  );
  const catSet = new Set(cats.map(c => c.category_name.toLowerCase().trim()));

  // Ambil semua standard_maintenances dengan leafName = subKategori (jika ada) atau kategori
  const sms = await seq.query(`
    SELECT DISTINCT
      sm.id,
      sm.kategori,
      sm.subKategori,
      CASE 
        WHEN sm.subKategori IS NOT NULL AND LTRIM(RTRIM(sm.subKategori)) != '-' AND LTRIM(RTRIM(sm.subKategori)) != ''
        THEN LTRIM(RTRIM(sm.subKategori))
        ELSE LTRIM(RTRIM(sm.kategori))
      END AS leafName
    FROM standard_maintenances sm
    ORDER BY sm.kategori, sm.subKategori
  `, { type: Sequelize.QueryTypes.SELECT });

  const noMatch = [];
  const matched = [];

  sms.forEach(sm => {
    const leaf = sm.leafName?.toLowerCase().trim();
    if (leaf && !catSet.has(leaf)) {
      noMatch.push(sm);
    } else {
      matched.push(sm);
    }
  });

  console.log(`=== STANDARD MAINTENANCE YANG TIDAK MATCH DENGAN asset_categories (${noMatch.length} item) ===`);
  if (noMatch.length === 0) {
    console.log('Semua sudah match!\n');
  } else {
    // Tampilkan beserta saran closest match
    const allCatNames = cats.map(c => c.category_name);
    noMatch.forEach(sm => {
      const leaf = sm.leafName;
      // Cari closest match berdasarkan substring
      const suggestions = allCatNames.filter(cn =>
        cn.toLowerCase().includes(leaf.toLowerCase().split(' ')[0]) ||
        leaf.toLowerCase().includes(cn.toLowerCase().split(' ')[0])
      ).slice(0, 3);
      
      console.log(`  ❌ SM id:${sm.id} | kategori:"${sm.kategori}" | subKategori:"${sm.subKategori}" | leafName:"${leaf}"`);
      if (suggestions.length > 0) {
        console.log(`     💡 Saran dari asset_categories: ${suggestions.map(s => `"${s}"`).join(', ')}`);
      } else {
        console.log(`     ⚠️  Tidak ada saran — nama benar-benar beda atau belum ada kategori`);
      }
    });
  }

  console.log(`\n=== YANG SUDAH MATCH (${matched.length} item) ===`);
  const matchedDistinct = [...new Set(matched.map(m => m.leafName))].sort();
  matchedDistinct.forEach(n => console.log(`  ✅ "${n}"`));

  // Cek juga sebaliknya: kategori asset yg ada tapi tidak dicover standard
  console.log(`\n=== KATEGORI ASSET YANG TIDAK ADA DI STANDARD MAINTENANCE ===`);
  const smLeaves = new Set(sms.map(s => s.leafName?.toLowerCase().trim()).filter(Boolean));
  const notInSM = cats.filter(c => !smLeaves.has(c.category_name.toLowerCase().trim()));
  if (notInSM.length === 0) {
    console.log('Semua kategori asset sudah dicoverage di standard maintenance.');
  } else {
    console.table(notInSM);
  }

  process.exit(0);
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
