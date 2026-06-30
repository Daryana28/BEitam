// be/check-acces-door.js
// Investigasi SM ACCES DOOR vs asset kategori terkait
// Jalankan: node check-acces-door.js

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
  console.log('✅ DB connected\n');

  // 1. SM yang punya ACCES DOOR
  const smAccessDoor = await seq.query(`
    SELECT id, kategori, subKategori, namaPerangkat, subPerangkat, tipePerangkat
    FROM standard_maintenances
    WHERE UPPER(subKategori) LIKE '%ACCES%' OR UPPER(kategori) LIKE '%ACCES%'
    ORDER BY id
  `, { type: Sequelize.QueryTypes.SELECT });

  console.log(`=== SM DENGAN "ACCES DOOR" (${smAccessDoor.length} item) ===`);
  console.table(smAccessDoor);

  // 2. SM "PC" yang tidak match
  const smPC = await seq.query(`
    SELECT id, kategori, subKategori, namaPerangkat, subPerangkat, tipePerangkat
    FROM standard_maintenances
    WHERE LTRIM(RTRIM(subKategori)) = 'PC'
    ORDER BY id
  `, { type: Sequelize.QueryTypes.SELECT });

  console.log(`\n=== SM DENGAN subKategori = "PC" (${smPC.length} item) ===`);
  console.table(smPC);

  // 3. Kategori asset yang kemungkinan adalah access door device
  const accessDoorCats = await seq.query(`
    SELECT 
      ac.category_id, ac.category_name, ac.parent_id, ac.level_no,
      COUNT(a.asset_id) AS jumlah_asset
    FROM asset_categories ac
    LEFT JOIN assets a ON a.category_id = ac.category_id
    WHERE UPPER(ac.category_name) LIKE '%READER%'
       OR UPPER(ac.category_name) LIKE '%SUPREMA%'
       OR UPPER(ac.category_name) LIKE '%ACCES%'
       OR UPPER(ac.category_name) LIKE '%DOOR%'
       OR UPPER(ac.category_name) LIKE '%FINGERPRINT%'
    GROUP BY ac.category_id, ac.category_name, ac.parent_id, ac.level_no
    ORDER BY ac.level_no
  `, { type: Sequelize.QueryTypes.SELECT });

  console.log(`\n=== KATEGORI ASSET TERKAIT ACCESS DOOR ===`);
  console.table(accessDoorCats);

  // 4. Kategori terkait PC
  const pcCats = await seq.query(`
    SELECT 
      ac.category_id, ac.category_name, ac.parent_id, ac.level_no,
      COUNT(a.asset_id) AS jumlah_asset
    FROM asset_categories ac
    LEFT JOIN assets a ON a.category_id = ac.category_id
    WHERE UPPER(ac.category_name) LIKE '%PC%'
       OR UPPER(ac.category_name) LIKE '%PERSONAL%'
       OR UPPER(ac.category_name) LIKE '%DESKTOP%'
       OR UPPER(ac.category_name) LIKE '%WORKSTATION%'
       OR UPPER(ac.category_name) LIKE '%ALL IN ONE%'
    GROUP BY ac.category_id, ac.category_name, ac.parent_id, ac.level_no
    ORDER BY ac.level_no, COUNT(a.asset_id) DESC
  `, { type: Sequelize.QueryTypes.SELECT });

  console.log(`\n=== KATEGORI ASSET TERKAIT PC/DESKTOP ===`);
  console.table(pcCats);

  // 5. Hierarki kategori ACCES DOOR (cek parent-childnya)
  const hierarchy = await seq.query(`
    SELECT 
      child.category_id, child.category_name, child.level_no,
      parent.category_name AS parent_name,
      COUNT(a.asset_id) AS jumlah_asset
    FROM asset_categories child
    LEFT JOIN asset_categories parent ON child.parent_id = parent.category_id
    LEFT JOIN assets a ON a.category_id = child.category_id
    WHERE child.parent_id = 40  -- child dari ACCES DOOR
       OR child.category_id = 40
    GROUP BY child.category_id, child.category_name, child.level_no, parent.category_name
  `, { type: Sequelize.QueryTypes.SELECT });

  console.log(`\n=== HIERARKI KATEGORI ACCES DOOR (id:40) ===`);
  if (hierarchy.length === 0) {
    console.log('ACCES DOOR tidak punya child kategori dan tidak punya asset.');
  } else {
    console.table(hierarchy);
  }

  process.exit(0);
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
