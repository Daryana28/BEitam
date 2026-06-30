import 'dotenv/config';
import xlsx from 'xlsx';
import { StandardMaintenance, StandardMaintenanceDetail, StandardMaintenanceCheck, AssetCategory, YearlyStandardMaintenance, sequelize } from './src/models/index.js';

async function seedFromExcel() {
  const transaction = await sequelize.transaction();
  try {
    // 1. Clear existing data
    await StandardMaintenanceCheck.destroy({ where: {}, transaction });
    await StandardMaintenanceDetail.destroy({ where: {}, transaction });
    await StandardMaintenance.destroy({ where: {}, transaction });
    console.log("Cleared old data.");

    // 2. Fetch AssetCategories
    const categories = await AssetCategory.findAll({ raw: true, transaction });
    const aliases = {
      'personal computer': 'pc',
      'telecomunication': 'telecomunication' // fallback
    };
    function getHierarchy(name) {
      if (!name) return null;
      let lowerName = name.toLowerCase();
      if (aliases[lowerName]) lowerName = aliases[lowerName];

      let cat = categories.find(c => c.category_name.toLowerCase() === lowerName);
      if (!cat) return null;
      const hier = [];
      while (cat) {
        hier.unshift(cat.category_name);
        cat = categories.find(c => c.category_id == cat.parent_id);
      }
      return hier;
    }

    const workbook = xlsx.readFile('d:\\DEV\\REACT\\ITAM\\New folder\\standard import.xlsx');
    const sheet = workbook.Sheets['Mapping Standar Monitoring (2)'];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let currentKategori = '';
    let currentNamaPerangkat = '';
    let currentSubPerangkat = '';
    let currentFungsi = '';
    let currentDesc = '';
    
    const smMap = {};
    let lastCheck = null;

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

      // Determine DB fields based on AssetCategory hierarchy
      let hier = getHierarchy(currentSubPerangkat);
      if (!hier) hier = getHierarchy(currentNamaPerangkat);
      if (!hier) hier = getHierarchy(currentKategori);

      let dbKategori = currentKategori.toUpperCase();
      let dbSubKategori = currentKategori;
      let dbNamaPerangkat = currentNamaPerangkat;
      let dbTipePerangkat = currentSubPerangkat;
      
      if (hier) {
        dbKategori = hier[0] || dbKategori;
        dbSubKategori = hier[1] || "";
        dbNamaPerangkat = hier[2] || "";
        dbTipePerangkat = hier[3] || "";
      }

      const upperSub = currentSubPerangkat.toUpperCase();
      if (upperSub === 'PABX') {
        dbKategori = 'UTAMA';
        dbSubKategori = 'SERVER';
        dbNamaPerangkat = 'PHYSICAL';
        dbTipePerangkat = 'TELECOMUNICATION';
      } else if (upperSub === 'TELEPHONE CABLE') {
        dbKategori = 'CLIENT';
        dbSubKategori = 'TELECOMUNICATIONS';
        dbNamaPerangkat = 'Telephone Cable';
        dbTipePerangkat = '';
      } else if (upperSub === 'TELEPHONE UNIT') {
        dbKategori = 'CLIENT';
        dbSubKategori = 'TELECOMUNICATIONS';
        dbNamaPerangkat = 'Telephone Unit';
        dbTipePerangkat = '';
      }

      const key = `${dbKategori}|${dbSubKategori}|${dbNamaPerangkat}|${dbTipePerangkat}`;

      if (!smMap[key]) {
        smMap[key] = {
          kategori: dbKategori,
          subKategori: dbSubKategori,
          namaPerangkat: dbNamaPerangkat,
          tipePerangkat: dbTipePerangkat,
          subPerangkat: currentSubPerangkat,
          details: {}
        };
      }

      if (!smMap[key].details[currentFungsi]) {
        smMap[key].details[currentFungsi] = {
          desc: currentDesc,
          checks: []
        };
      }

      if (pengecekan) {
        const isLowercase = pengecekan.charAt(0) === pengecekan.charAt(0).toLowerCase();
        if (!standard && !bagian && !metode && (alat === '-' || alat === '') && lastCheck && isLowercase) {
          lastCheck.pengecekan += ` ${pengecekan}`;
        } else {
          const newCheck = {
            pengecekan,
            standard,
            bagian,
            metode,
            alat: alat || '-',
            periodik: '1 Bulan'
          };
          smMap[key].details[currentFungsi].checks.push(newCheck);
          lastCheck = newCheck;
        }
      }
    }

    const yearlyStandard = await YearlyStandardMaintenance.findOne({ transaction });
    const yearly_standard_id = yearlyStandard ? yearlyStandard.id : 1;
    
    for (const key of Object.keys(smMap)) {
      const smData = smMap[key];
      
      let sm = await StandardMaintenance.create({
        yearly_standard_id,
        kategori: smData.kategori,
        subKategori: smData.subKategori,
        namaPerangkat: smData.namaPerangkat,
        tipePerangkat: smData.tipePerangkat,
        subPerangkat: smData.subPerangkat
      }, { transaction });

      for (const fungsiKey of Object.keys(smData.details)) {
        const detailData = smData.details[fungsiKey];
        
        const detail = await StandardMaintenanceDetail.create({
          standard_maintenance_id: sm.id,
          fungsi: fungsiKey,
          deskripsi: detailData.desc
        }, { transaction });

        for (const cek of detailData.checks) {
          await StandardMaintenanceCheck.create({
            ...cek,
            standard_maintenance_detail_id: detail.id
          }, { transaction });
        }
      }
    }

    await transaction.commit();
    console.log("Seeding from excel complete!");
    process.exit(0);

  } catch (error) {
    await transaction.rollback();
    console.error("Error seeding from excel:", error);
    process.exit(1);
  }
}

seedFromExcel();
