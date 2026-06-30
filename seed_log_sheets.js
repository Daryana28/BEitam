import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const seedLogSheets = async () => {
  try {
    const { default: sequelize } = await import('./src/config/db/db.js');
    const { default: models } = await import('./src/models/index.js');

    console.log('Connecting to database...');
    await sequelize.authenticate();

    // 1. Cari beberapa jadwal maintenance untuk disambungkan ke log sheet
    const schedules = await models.MaintenanceSchedule.findAll({
      limit: 3,
      order: [['created_at', 'DESC']]
    });

    if (schedules.length === 0) {
      console.log('Tidak ada data Maintenance Schedule. Buat jadwal terlebih dahulu agar bisa menambahkan log sheet.');
      process.exit(0);
    }

    console.log(`Ditemukan ${schedules.length} jadwal maintenance. Menambahkan mock data log sheet...`);

    const mockData = [
      {
        temuan: 'Suhu perangkat mencapai 85 derajat celsius, kipas pendingin berdebu tebal.',
        tindakan: 'Membersihkan kipas pendingin dan mengoleskan ulang thermal paste.',
        status_temuan: 'RESOLVED',
        tanggal_temuan: new Date(),
      },
      {
        temuan: 'Terdapat packet loss hingga 15% pada switch port 4.',
        tindakan: 'Sedang mengecek kabel uplink dan konfigurasi VLAN.',
        status_temuan: 'IN_PROGRESS',
        tanggal_temuan: new Date(new Date().setDate(new Date().getDate() - 1)), // 1 hari lalu
      },
      {
        temuan: 'Lisensi antivirus pada PC ini sudah kadaluarsa sejak bulan lalu.',
        tindakan: '',
        status_temuan: 'OPEN',
        tanggal_temuan: new Date(new Date().setDate(new Date().getDate() - 2)), // 2 hari lalu
      }
    ];

    // 2. Insert mock data
    for (let i = 0; i < schedules.length; i++) {
      const schedule = schedules[i];
      const data = mockData[i % mockData.length]; // Rotasi mock data
      
      await models.MaintenanceLogSheet.create({
        schedule_id: schedule.id,
        temuan: data.temuan,
        tindakan: data.tindakan,
        status_temuan: data.status_temuan,
        tanggal_temuan: data.tanggal_temuan,
        created_by: null // Atau bisa cari user yang ada, tapi karena allowNull: true, biarkan null dulu
      });
    }

    console.log('Mock data log sheet berhasil ditambahkan!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding log sheets:', error);
    process.exit(1);
  }
};

seedLogSheets();
