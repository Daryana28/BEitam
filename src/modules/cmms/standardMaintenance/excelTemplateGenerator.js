import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

const CATEGORY_CONFIG = {
  HARDWARE: {
    title: 'JADWAL MAINTENANCE HARDWARE',
    sheetName: 'Jadwal Hardware',
    groupName: 'HARDWARE',
    sampleData: {
      c1: 'CCTV', c2: 'NVR', c3: 'NVR', c5: 'Recording',
      c6: 'NVR bisa menyimpan Data Recording Kamera ke Storage HDD',
      c7: 'Cek symbol REC',
      standard: 'Symbol REC menyala merah',
      bagian: 'Main Menu',
      metode: 'Visual Check',
      alat: 'Software'
    }
  },
  SOFTWARE_HW: {
    title: 'JADWAL MAINTENANCE SOFTWARE HARDWARE',
    sheetName: 'Jadwal Software Hardware',
    groupName: 'SOFTWARE HARDWARE',
    sampleData: {
      c1: 'Software Hardware', c2: 'PC Desktop', c3: 'PC', c5: 'Operating System',
      c6: 'PC dapat menjalankan OS dengan normal',
      c7: 'Cek performa OS',
      standard: 'OS berjalan normal tanpa error',
      bagian: 'System Properties',
      metode: 'Visual Check',
      alat: 'Tidak ada'
    }
  },
  APPLICATION: {
    title: 'JADWAL MAINTENANCE APLIKASI',
    sheetName: 'Jadwal Aplikasi',
    groupName: 'APPLICATION',
    sampleData: {
      c1: 'Business Application', c2: 'ERP System', c3: 'ERP', c5: 'Database',
      c6: 'Database aplikasi dapat diakses dengan normal',
      c7: 'Cek koneksi database',
      standard: 'Koneksi database aktif',
      bagian: 'Database Server',
      metode: 'Technical Check',
      alat: 'Aplikasi'
    }
  },
  NETWORK_CYBER: {
    title: 'JADWAL MAINTENANCE CYBER & NETWORK',
    sheetName: 'Jadwal Cyber & Network',
    groupName: 'CYBER SECURITY',
    sampleData: {
      c1: 'Firewall Protection', c2: 'Firewall', c3: 'Firewall', c5: 'Network Security',
      c6: 'Firewall berfungsi memfilter traffic jaringan',
      c7: 'Cek status firewall',
      standard: 'Firewall aktif dan memfilter traffic',
      bagian: 'Management Console',
      metode: 'Technical Check',
      alat: 'Aplikasi'
    }
  }
};

export const generateTemplate = (kategoriKey) => {
  const config = CATEGORY_CONFIG[kategoriKey];
  if (!config) {
    throw new Error(`Template untuk kategori "${kategoriKey}" tidak tersedia`);
  }

  const wb = xlsx.utils.book_new();
  const ws = {};

  // Row 0: Title
  ws[xlsx.utils.encode_cell({ c: 3, r: 0 })] = { v: config.title };

  // Row 4: Headers
  const r4Headers = [
    { c: 0, v: 'No' },
    { c: 1, v: 'Kategori' },
    { c: 2, v: 'Nama Perangkat' },
    { c: 3, v: 'Sub Perangkat' },
    { c: 4, v: 'No' },
    { c: 5, v: 'Fungsi' },
    { c: 6, v: 'DESC' },
    { c: 7, v: 'Pengecekan' },
    { c: 8, v: 'Pengecekan Normal' },
    { c: 24, v: '2026' }
  ];
  r4Headers.forEach(h => {
    ws[xlsx.utils.encode_cell({ c: h.c, r: 4 })] = { v: h.v };
  });

  // Row 5: Sub-header "STANDART"
  ws[xlsx.utils.encode_cell({ c: 8, r: 5 })] = { v: 'STANDART' };

  // Row 6: Group name + Periodik
  ws[xlsx.utils.encode_cell({ c: 8, r: 6 })] = { v: config.groupName };
  ws[xlsx.utils.encode_cell({ c: 24, r: 6 })] = { v: 'Periodik' };

  // Row 7: Sub-headers for the check group
  ws[xlsx.utils.encode_cell({ c: 8, r: 7 })] = { v: 'Standar' };
  ws[xlsx.utils.encode_cell({ c: 9, r: 7 })] = { v: 'Bagian' };
  ws[xlsx.utils.encode_cell({ c: 10, r: 7 })] = { v: 'Metode' };
  ws[xlsx.utils.encode_cell({ c: 11, r: 7 })] = { v: 'Alat' };

  // Row 8: Sample data
  const s = config.sampleData;
  ws[xlsx.utils.encode_cell({ c: 0, r: 8 })] = { v: '1' };
  ws[xlsx.utils.encode_cell({ c: 1, r: 8 })] = { v: s.c1 };
  ws[xlsx.utils.encode_cell({ c: 2, r: 8 })] = { v: s.c2 };
  ws[xlsx.utils.encode_cell({ c: 3, r: 8 })] = { v: s.c3 };
  ws[xlsx.utils.encode_cell({ c: 4, r: 8 })] = { v: '1' };
  ws[xlsx.utils.encode_cell({ c: 5, r: 8 })] = { v: s.c5 };
  ws[xlsx.utils.encode_cell({ c: 6, r: 8 })] = { v: s.c6 };
  ws[xlsx.utils.encode_cell({ c: 7, r: 8 })] = { v: s.c7 };
  ws[xlsx.utils.encode_cell({ c: 8, r: 8 })] = { v: s.standard };
  ws[xlsx.utils.encode_cell({ c: 9, r: 8 })] = { v: s.bagian };
  ws[xlsx.utils.encode_cell({ c: 10, r: 8 })] = { v: s.metode };
  ws[xlsx.utils.encode_cell({ c: 11, r: 8 })] = { v: s.alat };
  ws[xlsx.utils.encode_cell({ c: 24, r: 8 })] = { v: '1 Bulan' };

  // Set sheet range ref
  ws['!ref'] = xlsx.utils.encode_range({
    s: { c: 0, r: 0 },
    e: { c: 24, r: 8 }
  });

  xlsx.utils.book_append_sheet(wb, ws, config.sheetName);
  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

export const ensureTemplatesDirectory = () => {
  const dirPath = path.resolve('../@docs/templates');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log('Created templates directory at @docs/templates');
  }
};
