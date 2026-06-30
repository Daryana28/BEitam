import 'dotenv/config';
import xlsx from 'xlsx';
import { AssetCategory } from './src/models/index.js';

async function checkMissing() {
  const categories = await AssetCategory.findAll({ raw: true });
  const dbNames = categories.map(c => c.category_name.toLowerCase());

  const workbook = xlsx.readFile('d:\\DEV\\REACT\\ITAM\\New folder\\standard import.xlsx');
  const sheet = workbook.Sheets['Mapping Standar Monitoring (2)'];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  const excelSet = new Set();

  for (let i = 8; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const isRowEmpty = row.every(cell => cell === undefined || cell === null || String(cell).trim() === '');
    if (isRowEmpty) continue;

    if (row[1]) excelSet.add(String(row[1]).trim());
    if (row[2]) excelSet.add(String(row[2]).trim());
    if (row[3]) excelSet.add(String(row[3]).trim());
  }

  const missing = [];
  for (const name of excelSet) {
    if (!dbNames.includes(name.toLowerCase())) {
      missing.push(name);
    }
  }

  console.log("=== ITEM DI EXCEL YANG TIDAK ADA DI DATABASE (ASSET CATEGORY) ===");
  missing.forEach(m => console.log("- " + m));
  console.log("===================================================================");
  process.exit(0);
}

checkMissing();
