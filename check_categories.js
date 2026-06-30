import 'dotenv/config';
import db from './src/models/index.js';

async function check() {
  try {
    const { AssetCategory, StandardMaintenance } = db;
    
    const standards = await StandardMaintenance.findAll({ raw: true });
    const standardCategories = new Set();
    const smRawMap = {};
    
    standards.forEach(sm => {
        const leafName = sm.subKategori && sm.subKategori.trim() !== "-" ? sm.subKategori : sm.kategori;
        if (leafName) {
            const lower = leafName.toLowerCase().trim();
            standardCategories.add(lower);
            smRawMap[lower] = leafName;
        }
    });
    
    const assetCategories = await AssetCategory.findAll({ raw: true });
    const acSet = new Set();
    const acMap = {};
    
    assetCategories.forEach(ac => {
        const name = ac.category_name;
        if (name) {
            const lower = name.toLowerCase().trim();
            acSet.add(lower);
            acMap[lower] = name;
        }
    });

    console.log("=== KATEGORI DI STANDARD MAINTENANCE YANG TIDAK COCOK DENGAN MASTER ASSET ===");
    const missing = [];
    for (const smCat of standardCategories) {
        if (!acSet.has(smCat)) {
            missing.push(smRawMap[smCat]);
        }
    }

    if (missing.length === 0) {
        console.log("Semua sudah cocok!");
    } else {
        missing.forEach(m => console.log("- " + m));
    }

    console.log("\n=== CONTOH MASTER ASSET CATEGORY YANG TERSEDIA ===");
    console.log(Object.values(acMap).join(", "));
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

check();
