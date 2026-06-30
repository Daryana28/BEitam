import 'dotenv/config';
import { StandardMaintenance, StandardMaintenanceDetail, StandardMaintenanceCheck } from './src/models/index.js';

async function seedRouterChecks() {
  try {
    const kategori = "Networking";
    const subKategori = "Router";
    const namaPerangkat = "All Router";
    const tipePerangkat = ""; // Jenis Perangkat
    const fungsi = "Network Routing";
    const deskripsi = "Penghubung jaringan internet antara ISP dengan server & client";
    const yearly_standard_id = 1; // Assuming default 1

    let sm = await StandardMaintenance.findOne({
      where: { kategori, subKategori, namaPerangkat, tipePerangkat }
    });

    if (!sm) {
      sm = await StandardMaintenance.create({
        yearly_standard_id, kategori, subKategori, namaPerangkat, tipePerangkat
      });
      console.log("Created StandardMaintenance parent.");
    }

    let detail = await StandardMaintenanceDetail.findOne({
      where: { standard_maintenance_id: sm.id, fungsi }
    });

    if (!detail) {
      detail = await StandardMaintenanceDetail.create({
        standard_maintenance_id: sm.id, fungsi, deskripsi
      });
      console.log("Created StandardMaintenanceDetail.");
    }

    const checks = [
      {
        standard_maintenance_detail_id: detail.id,
        pengecekan: "Cek Kondisi lampu LED indikator SYST PWR",
        standard: "LED indikator SYST PWR menyala hijau",
        bagian: "Luar Depan",
        periodik: "1 Bulan",
        metode: "Visual Check",
        alat: "-"
      },
      {
        standard_maintenance_detail_id: detail.id,
        pengecekan: "Cek Kondisi lampu LED indikator SYST ACT",
        standard: "LED indikator SYST ACT menyala hijau",
        bagian: "Luar Depan",
        periodik: "1 Bulan",
        metode: "Visual Check",
        alat: "-"
      },
      {
        standard_maintenance_detail_id: detail.id,
        pengecekan: "Cek Kebersihan Perangkat Router",
        standard: "Tidak Kotor/Berdebu",
        bagian: "Luar",
        periodik: "1 Bulan",
        metode: "Visual Check",
        alat: "Cleaning Tools"
      }
    ];

    for (const cek of checks) {
      const existing = await StandardMaintenanceCheck.findOne({
        where: { standard_maintenance_detail_id: detail.id, pengecekan: cek.pengecekan }
      });
      if (!existing) {
        await StandardMaintenanceCheck.create(cek);
        console.log(`Inserted check: ${cek.pengecekan}`);
      } else {
        console.log(`Check already exists: ${cek.pengecekan}`);
      }
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding:", error);
    process.exit(1);
  }
}

seedRouterChecks();
