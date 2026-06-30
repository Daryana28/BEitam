// be/check-mismatch-detail.js
// Cek asset yang kemungkinan salah kategori berdasarkan keyword nama
// Jalankan: node check-mismatch-detail.js

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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

const sequelize = new Sequelize(
  process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 1433),
    dialect: 'mssql',
    dialectOptions: { options: { encrypt: false, trustServerCertificate: true } },
    logging: false,
  }
);

// Mapping: keyword yg ada di asset_name → kategori leaf yg seharusnya
const KEYWORD_MAP = [
  { keywords: ['ROUTER', 'ROUTERBOARD'],           targetCatId: 51, targetCatName: 'ROUTER' },
  { keywords: ['FIREWALL', 'FORTIGATE', 'PFSENSE'], targetCatId: 23, targetCatName: 'FIREWALL' },
  { keywords: ['NVR'],                              targetCatId: 50, targetCatName: 'NVR' },
  { keywords: ['SWITCH L3', ' L3 '],               targetCatId: 26, targetCatName: 'L3' },
  { keywords: ['VIRTUAL', 'VM ', 'VMWARE', 'ESXI'], targetCatId: 31, targetCatName: 'VIRTUAL' },
  { keywords: ['STORAGE', 'NAS ', 'SAN '],         targetCatId: 53, targetCatName: 'Storage Device' },
  { keywords: ['PANEL RACK', 'RACK'],              targetCatId: 52, targetCatName: 'PANEL RACK' },
  { keywords: ['TELEPHONE', 'TELEPON', 'TELPON'],  targetCatId: 67, targetCatName: 'Telephone Unit' },
  { keywords: ['INDUSTRIAL', 'PC INDUSTRI'],       targetCatId: 68, targetCatName: 'PC INDUSTRIAL' },
  { keywords: ['FACE ATTENDAN', 'ABSENSI', 'FINGERPRINT'], targetCatId: 60, targetCatName: 'Face Attendance' },
  { keywords: ['WIRELESS DISPLAY', 'TRANSMITER'],  targetCatId: 94, targetCatName: 'WIRELESS DISPLAY TRANSMITER' },
  { keywords: ['ACCES DOOR', 'ACCESS DOOR', 'PINTU AKSES'], targetCatId: 40, targetCatName: 'ACCES DOOR' },
  { keywords: ['PODCAST'],                         targetCatId: 98, targetCatName: 'PODCAST ASET' },
  { keywords: ['TABLET', ' TAB '],                 targetCatId: 46, targetCatName: 'TABLET' },
];

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected\n');

    const suspectList = [];

    for (const rule of KEYWORD_MAP) {
      const conditions = rule.keywords
        .map(k => `UPPER(a.asset_name) LIKE '%${k.toUpperCase()}%'`)
        .join(' OR ');

      const rows = await sequelize.query(`
        SELECT 
          a.asset_id,
          a.asset_code,
          a.asset_name,
          a.category_id        AS current_cat_id,
          ac.category_name     AS current_cat_name,
          ac.level_no          AS current_level
        FROM assets a
        JOIN asset_categories ac ON a.category_id = ac.category_id
        WHERE (${conditions})
          AND a.category_id <> ${rule.targetCatId}
        ORDER BY a.asset_name
      `, { type: Sequelize.QueryTypes.SELECT });

      if (rows.length > 0) {
        console.log(`\n=== KANDIDAT SALAH KATEGORI → seharusnya [${rule.targetCatName}] (id:${rule.targetCatId}) — ${rows.length} asset ===`);
        const display = rows.map(r => ({
          asset_id:         r.asset_id,
          asset_code:       r.asset_code,
          asset_name:       r.asset_name,
          current_cat_id:   r.current_cat_id,
          current_cat_name: r.current_cat_name,
        }));
        console.table(display);
        suspectList.push(...rows.map(r => ({ ...r, suggested_cat: rule.targetCatName, suggested_cat_id: rule.targetCatId })));
      }
    }

    console.log(`\n📊 TOTAL KANDIDAT SALAH KATEGORI: ${suspectList.length} asset`);

    // Breakdown per kategori saat ini
    if (suspectList.length > 0) {
      const grouped = {};
      suspectList.forEach(r => {
        const key = r.current_cat_name;
        grouped[key] = (grouped[key] || 0) + 1;
      });
      console.log('\n=== SEBARAN DARI KATEGORI MANA ASSET TERSEBUT SAAT INI ===');
      console.table(
        Object.entries(grouped)
          .sort((a, b) => b[1] - a[1])
          .map(([cat, count]) => ({ kategori_saat_ini: cat, jumlah: count }))
      );
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
