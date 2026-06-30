import xlsx from 'xlsx';

const workbook = xlsx.readFile('be/BUDGETASET.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log('Columns in BUDGETASET.xlsx:');
console.log(data[0]); // Header row
console.log('Sample row:');
console.log(data[1]); // First data row
