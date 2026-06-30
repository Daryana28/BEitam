import 'dotenv/config';
import { StandardMaintenance, StandardMaintenanceDetail, StandardMaintenanceCheck } from './src/models/index.js';

async function seedNvrChecks() {
  try {
    const kategori = "UTAMA";
    const subKategori = "SERVER";
    const namaPerangkat = "PHYSICAL"; // Tipe Perangkat
    const tipePerangkat = "NVR CCTV"; // Jenis Perangkat
    const yearly_standard_id = 1;

    let sm = await StandardMaintenance.findOne({
      where: { kategori, subKategori, namaPerangkat, tipePerangkat }
    });

    if (!sm) {
      sm = await StandardMaintenance.create({
        yearly_standard_id, kategori, subKategori, namaPerangkat, tipePerangkat
      });
      console.log("Created StandardMaintenance parent for NVR CCTV.");
    } else {
      // Hapus detail dan pengecekan lama agar sinkron dengan data terbaru
      const oldDetails = await StandardMaintenanceDetail.findAll({
        where: { standard_maintenance_id: sm.id }
      });
      for (const d of oldDetails) {
        await StandardMaintenanceCheck.destroy({ where: { standard_maintenance_detail_id: d.id } });
        await d.destroy();
      }
      console.log("Cleared old NVR checks.");
    }

    const dataTree = [
      {
        fungsi: "Recording",
        deskripsi: "NVR bisa menyimpan Data Recording Kamera ke Storage HDD",
        checks: [
          {
            pengecekan: "Cek symbol REC",
            standard: "Symbol REC menyala merah",
            bagian: "Main Menu",
            periodik: "1 Bulan",
            metode: "Visual Check",
            alat: "Software"
          },
          {
            pengecekan: "Download hasil recording 1 minggu kebelakang",
            standard: "NVR dapat menyimpan rekaman",
            bagian: "Main Menu",
            periodik: "1 Bulan",
            metode: "Visual Check",
            alat: "Software"
          }
        ]
      },
      {
        fungsi: "HDD",
        deskripsi: "Memastikan HDD dalam kondisi layak",
        checks: [
          {
            pengecekan: "Cek Hour Meter HDD",
            standard: "Hour Meter tidak boleh lebih dari 20.000",
            bagian: "Luar Depan",
            periodik: "1 Bulan",
            metode: "Visual Check",
            alat: "Software"
          }
        ]
      },
      {
        fungsi: "Power",
        deskripsi: "Memastikan kabel dalam layak pakai",
        checks: [
          {
            pengecekan: "Cek kabel power",
            standard: "Kabel tidak terkelupas",
            bagian: "Luar Depan",
            periodik: "1 Bulan",
            metode: "Visual Check",
            alat: "-"
          },
          {
            pengecekan: "Cek kabel power",
            standard: "Kabel tidak terbakar",
            bagian: "Luar Depan",
            periodik: "1 Bulan",
            metode: "Visual Check",
            alat: "-"
          },
          {
            pengecekan: "Cek kabel power",
            standard: "Kabel tidak terjepit",
            bagian: "Luar Belakang",
            periodik: "1 Bulan",
            metode: "Visual Check",
            alat: "-"
          }
        ]
      },
      {
        fungsi: "Log",
        deskripsi: "Memeriksa event dari",
        checks: [
          {
            pengecekan: "Cek Log yang terdapat pada NVR",
            standard: "Pastikan error log sudah recovered",
            bagian: "-",
            periodik: "1 Bulan",
            metode: "Visual Check",
            alat: "-"
          }
        ]
      },
      {
        fungsi: "Notifikasi Error & Update",
        deskripsi: "Informasi status kondisi abnormal pada NVR",
        checks: [
          {
            pengecekan: "Cek Lampu LED indikator ERROR",
            standard: "LED ERROR tidak menyala",
            bagian: "Luar Depan",
            periodik: "1 Bulan",
            metode: "Visual Check",
            alat: "-"
          },
          {
            pengecekan: "Cek Error Message yang ditampilkan pada layar display",
            standard: "Tidak menampilkan ERROR MESSAGE pada layar display",
            bagian: "Luar Depan",
            periodik: "1 Bulan",
            metode: "Visual Check",
            alat: "-"
          },
          {
            pengecekan: "Cek Kebersihan Perangkat NVR",
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

    console.log("Seeding NVR CCTV complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding NVR CCTV:", error);
    process.exit(1);
  }
}

seedNvrChecks();
