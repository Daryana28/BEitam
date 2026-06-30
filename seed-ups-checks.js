import 'dotenv/config';
import { StandardMaintenance, StandardMaintenanceDetail, StandardMaintenanceCheck } from './src/models/index.js';

async function seedUpsChecks() {
  try {
    const kategori = "UTAMA";
    const subKategori = "UTILITY";
    const namaPerangkat = "UPS"; // Tipe Perangkat
    const tipePerangkat = "APC"; // Jenis Perangkat
    const yearly_standard_id = 1;

    let sm = await StandardMaintenance.findOne({
      where: { kategori, subKategori, namaPerangkat, tipePerangkat }
    });

    if (!sm) {
      sm = await StandardMaintenance.create({
        yearly_standard_id, kategori, subKategori, namaPerangkat, tipePerangkat
      });
      console.log("Created StandardMaintenance parent for UPS APC.");
    } else {
      // Hapus detail dan pengecekan lama agar sinkron dengan data terbaru
      const oldDetails = await StandardMaintenanceDetail.findAll({
        where: { standard_maintenance_id: sm.id }
      });
      for (const d of oldDetails) {
        await StandardMaintenanceCheck.destroy({ where: { standard_maintenance_detail_id: d.id } });
        await d.destroy();
      }
      console.log("Cleared old UPS checks.");
    }

    const dataTree = [
      {
        fungsi: "Backup Electrical Power",
        deskripsi: "Sebagai penyimpanan arus listrik ke batere sebagai backup arus listrik ketika aliran listrik mengalami problem",
        checks: [
          {
            pengecekan: "Cek Lampu LED indikator POWER",
            standard: "LED POWER berwarna HIJAU",
            bagian: "Luar Depan",
            periodik: "1 Bulan",
            metode: "Visual Check",
            alat: "-"
          },
          {
            pengecekan: "Cek Lampu LED indikator BATERE",
            standard: "LED BATERE berwarna HIJAU",
            bagian: "Luar Depan",
            periodik: "1 Bulan",
            metode: "Visual Check",
            alat: "-"
          },
          {
            pengecekan: "Cek Lampu LED indikator CHARGING",
            standard: "LED BATERE berwarna HIJAU",
            bagian: "Luar Depan",
            periodik: "1 Bulan",
            metode: "Visual Check",
            alat: "-"
          },
          {
            pengecekan: "Cek Lampu LED indikator LOAD",
            standard: "LED BATERE berwarna HIJAU",
            bagian: "Luar Depan",
            periodik: "1 Bulan",
            metode: "Visual Check",
            alat: "-"
          },
          {
            pengecekan: "Cek Tombol Power",
            standard: "Bisa ditekan dan menyala berwarna HIJAU",
            bagian: "Luar Depan",
            periodik: "1 Bulan",
            metode: "Visual Check",
            alat: "-"
          },
          {
            pengecekan: "Cek layar display UPS",
            standard: "Menampilkan status kondisi UPS secara digital",
            bagian: "Luar Depan",
            periodik: "1 Bulan",
            metode: "Visual Check",
            alat: "-"
          }
        ]
      },
      {
        fungsi: "Notifikasi Error",
        deskripsi: "Informasi status kondisi abnormal pada UPS",
        checks: [
          {
            pengecekan: "Cek Lampu LED indikator ERROR",
            standard: "LED ERROR tidak boleh menyala",
            bagian: "Luar Depan",
            periodik: "1 Bulan",
            metode: "Visual Check",
            alat: "-"
          },
          {
            pengecekan: "Cek Kebersihan Perangkat UPS",
            standard: "Tidak Kotor/Berdebu",
            bagian: "Luar",
            periodik: "1 Bulan",
            metode: "Visual Check & Cleaning",
            alat: "Cleaning Tools"
          }
        ]
      }
    ];

    for (const item of dataTree) {
      let detail = await StandardMaintenanceDetail.create({
        standard_maintenance_id: sm.id,
        fungsi: item.fungsi,
        deskripsi: item.deskripsi
      });
      console.log(`Created Fungsi: ${item.fungsi}`);

      for (const cek of item.checks) {
        await StandardMaintenanceCheck.create({
          ...cek,
          standard_maintenance_detail_id: detail.id
        });
        console.log(`  Inserted check: ${cek.pengecekan}`);
      }
    }

    console.log("Seeding UPS APC complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding UPS APC:", error);
    process.exit(1);
  }
}

seedUpsChecks();
