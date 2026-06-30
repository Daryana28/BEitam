import xlsx from 'xlsx';
import path from 'path';

const excelPath = path.resolve('../@docs/sample/HW-STANDAR MAINTENANCE DAN JADWAL 2026.xlsx');

try {
  const workbook = xlsx.readFile(excelPath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const range = xlsx.utils.decode_range(worksheet['!ref']);
  
  console.log("Sheet dimensions:", range.s.r, "to", range.e.r, "rows,", range.s.c, "to", range.e.c, "columns");

  // Output first 12 rows of columns 0 to 80
  const maxCols = Math.min(80, range.e.c);
  for (let r = 0; r <= 12; r++) {
    const rowCells = [];
    for (let c = 0; c <= maxCols; c++) {
      const cellAddress = { c, r };
      const cellRef = xlsx.utils.encode_cell(cellAddress);
      const cell = worksheet[cellRef];
      let val = cell ? String(cell.v).trim() : "";
      if (val) {
        rowCells.push(`Col${c}:${val}`);
      }
    }
    if (rowCells.length > 0) {
      console.log(`Row ${r}:`, rowCells.join(" | "));
    }
  }

} catch (error) {
  console.error("Error:", error);
}
