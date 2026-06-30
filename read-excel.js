import xlsx from 'xlsx';

const workbook = xlsx.readFile('d:\\DEV\\REACT\\ITAM\\New folder\\standard import.xlsx');
const sheet = workbook.Sheets['Mapping Standar Monitoring (2)'];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

let currentKategori = '';
let currentNamaPerangkat = '';
let currentSubPerangkat = '';
let currentFungsi = '';
let currentDesc = '';

const results = [];

for (let i = 8; i < rows.length; i++) {
  const row = rows[i];
  if (!row || row.length === 0) continue;

  const isRowEmpty = row.every(cell => cell === undefined || cell === null || String(cell).trim() === '');
  if (isRowEmpty) continue;

  if (row[1]) currentKategori = String(row[1]).trim();
  if (row[2]) currentNamaPerangkat = String(row[2]).trim();
  if (row[3]) currentSubPerangkat = String(row[3]).trim();
  
  if (row[5]) currentFungsi = String(row[5]).trim();
  if (row[6]) currentDesc = String(row[6]).trim();

  const pengecekan = row[7] ? String(row[7]).trim() : '';
  const standard = row[8] ? String(row[8]).trim() : '';
  const bagian = row[9] ? String(row[9]).trim() : '';
  const metode = row[10] ? String(row[10]).trim() : '';
  const alat = row[11] ? String(row[11]).trim() : '-';

  if (pengecekan) {
    results.push({
      kategori: currentKategori,
      namaPerangkat: currentNamaPerangkat,
      subPerangkat: currentSubPerangkat,
      fungsi: currentFungsi,
      desc: currentDesc,
      check: {
        pengecekan,
        standard,
        bagian,
        metode,
        alat,
        periodik: '1 Bulan'
      }
    });
  }
}

console.log(JSON.stringify(results.slice(0, 5), null, 2));
console.log(`Total checks: ${results.length}`);
