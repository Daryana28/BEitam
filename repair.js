import "dotenv/config";
import db from "./src/models/index.js";
const { AssetCategory, StandardMaintenance } = db;

async function repair() {
  console.log("Memulai perbaikan data kategori yang rusak...");
  try {
    const sms = await StandardMaintenance.findAll();
    let fixed = 0;
    for (let sm of sms) {
      if (sm.kategori && sm.subKategori) {
        const kat = await AssetCategory.findOne({ where: { category_name: sm.kategori, level_no: 1 } });
        if (kat) {
          const [updated] = await AssetCategory.update(
            { parent_id: kat.category_id, level_no: 2 },
            { where: { category_name: sm.subKategori } }
          );
          if (updated > 0) fixed++;
        }
      }
    }
    console.log(`Perbaikan selesai! ${fixed} Sub Kategori berhasil direstorasi.`);
  } catch (error) {
    console.error("Gagal memperbaiki:", error);
  }
  process.exit(0);
}

repair();
