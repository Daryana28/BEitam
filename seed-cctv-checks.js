import 'dotenv/config';
import { StandardMaintenance, StandardMaintenanceDetail, StandardMaintenanceCheck } from './src/models/index.js';

async function seedCctvChecks() {
  try {
    const kategori = "CLIENT";
    const subKategori = "CCTV";
    const namaPerangkat = "CAMERA"; // Tipe Perangkat
    const tipePerangkat = ""; // Jenis Perangkat (-)
    const yearly_standard_id = 1;

    let sm = await StandardMaintenance.findOne({
      where: { kategori, subKategori, namaPerangkat, tipePerangkat }
    });

    if (!sm) {
      sm = await StandardMaintenance.create({
        yearly_standard_id, kategori, subKategori, namaPerangkat, tipePerangkat
      });
      console.log("Created StandardMaintenance parent for CCTV CAMERA.");
    } else {
      // Hapus detail dan pengecekan lama agar sinkron dengan data terbaru
      const oldDetails = await StandardMaintenanceDetail.findAll({
        where: { standard_maintenance_id: sm.id }
      });
      for (const d of oldDetails) {
        await StandardMaintenanceCheck.destroy({ where: { standard_maintenance_detail_id: d.id } });
        await d.destroy();
      }
      console.log("Cleared old CCTV CAMERA checks.");
    }

    const dataTree = [
      {
        fungsi: "Capture",
        deskripsi: "CCTV dapat menangkap citra dari objek dan akan dikirimkan ke NVR",
        checks: [
          {
            pengecekan: "Cek Kondisi fisik lensa Kamera CCTV",
            standard: "Tidak Buram/Berembun",
            bagian: "Luar Depan",
            periodik: "1 Bulan",
            metode: "Visual Check",
            alat: "-"
          },
          {
            pengecekan: "Cek Tampilan hasil rekaman",
            standard: "Tidak Buram/Berembun",
            bagian: "Aplikasi",
            periodik: "1 Bulan",
            metode: "Visual Check",
            alat: "-"
          },
          {
            pengecekan: "Cek Kebersihan Perangkat Kamera",
            standard: "Tidak Kotor/Berdebu",
            bagian: "Luar",
            periodik: "1 Bulan",
            metode: "Visual Check & Cleaning",
            alat: "Cleaning Tools"
          }
        ]
      },
      {
        fungsi: "Data Transaction",
        deskripsi: "CCTV dapat melakukan transfer data ke NVR untuk dilakukan pengolahan citra hasil tangkapan",
        checks: [
          {
            pengecekan: "Cek kondisi Fisik kabel jaringan dari Port Ethernet CCTV ke Port Ethernet Switch di panel Rack",
            standard: "Kondisi Fisik Tidak Rusak & Semua PIN kabel (8 Core) Menyala semua",
            bagian: "Luar",
            periodik: "1 Bulan",
            metode: "Visual Check",
            alat: "LAN Tester"
          },
          {
            pengecekan: "Cek Kondisi lampu LED indikator POWER & ETHERNET Port pada unit CCTV",
            standard: "Kondisi Lampu LED indikator POWER & ETHERNET Port menyala hijau dan Blinking",
            bagian: "Luar",
            periodik: "1 Bulan",
            metode: "Visual Check",
            alat: "-"
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

    console.log("Seeding CCTV CAMERA complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding CCTV CAMERA:", error);
    process.exit(1);
  }
}

seedCctvChecks();
