import 'dotenv/config';
import bcrypt from 'bcrypt';
import db from './src/models/index.js';
import { generateCheckboxDates } from './src/modules/cmms/maintenanceSchedule/checkboxGenerator.js';

async function seed() {
  try {
    console.log("Starting database seeding...");

    // Clean up existing transaction & checklist data for a clean reset
    console.log("Cleaning up existing maintenance data...");
    await db.MaintenanceLogSheet.destroy({ where: {} });
    await db.MaintenanceAbnormalLog.destroy({ where: {} });
    await db.MaintenanceActual.destroy({ where: {} });
    await db.MaintenanceSchedule.destroy({ where: {} });
    await db.StandardMaintenanceCheck.destroy({ where: {} });
    await db.StandardMaintenanceDetail.destroy({ where: {} });
    await db.StandardMaintenance.destroy({ where: {} });
    await db.YearlyStandardMaintenance.destroy({ where: {} });
    await db.Asset.destroy({ where: {} });
    await db.AssetCategory.destroy({ where: {} });
    await db.AssetLocation.destroy({ where: {} });
    console.log("✓ Cleanup finished.");

    // 1. Seed Company
    const [company] = await db.Company.findOrCreate({
      where: { company_code: 'COMP01' },
      defaults: {
        company_name: 'Enterprise IT Solutions',
        is_active: true,
        created_at: new Date()
      }
    });
    console.log("✓ Seeded Company:", company.company_name);

    // 2. Seed Department
    const [dept] = await db.Department.findOrCreate({
      where: { department_name: 'IT Operations' },
      defaults: {
        company_id: company.company_id,
        department_code: 'IT',
        is_active: true,
        created_at: new Date()
      }
    });
    console.log("✓ Seeded Department:", dept.department_name);

    // 3. Seed Job Level
    const [level] = await db.JobLevel.findOrCreate({
      where: { level_name: 'Senior Administrator' },
      defaults: {
        description: 'Senior System Administrator Level',
        rank_order: 1
      }
    });
    console.log("✓ Seeded Job Level:", level.level_name);

    // 4. Seed Roles
    const [adminRole] = await db.Role.findOrCreate({
      where: { role_name: 'Admin' }
    });
    const [superAdminRole] = await db.Role.findOrCreate({
      where: { role_name: 'SuperAdmin' }
    });
    console.log("✓ Seeded Roles");

    // 5. Seed Users
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const [user1] = await db.User.findOrCreate({
      where: { email: 'tester@example.com' },
      defaults: {
        company_id: company.company_id,
        department_id: dept.department_id,
        job_level_id: level.level_id,
        username: 'tester',
        full_name: 'QA Tester Profile',
        password_hash: passwordHash,
        is_active: true,
        created_at: new Date()
      }
    });

    const [user2] = await db.User.findOrCreate({
      where: { email: 'admin@example.com' },
      defaults: {
        company_id: company.company_id,
        department_id: dept.department_id,
        job_level_id: level.level_id,
        username: 'admin',
        full_name: 'Super Administrator',
        password_hash: passwordHash,
        is_active: true,
        created_at: new Date()
      }
    });
    console.log("✓ Seeded Users (tester@example.com / password123, admin@example.com / password123)");

    // Link user roles
    await db.UserRole.findOrCreate({
      where: { user_id: user1.user_id, role_id: adminRole.role_id }
    });
    await db.UserRole.findOrCreate({
      where: { user_id: user2.user_id, role_id: superAdminRole.role_id }
    });
    console.log("✓ Linked Users to Roles");

    // 6. Seed Location
    const [loc] = await db.AssetLocation.findOrCreate({
      where: { location_name: 'IT Data Center Lt. 3' }
    });
    console.log("✓ Seeded Asset Location:", loc.location_name);

    // 7. Seed Asset Categories (Hardware, Software, Networking, Cyber)
    const [catHW] = await db.AssetCategory.findOrCreate({
      where: { category_name: 'Hardware' },
      defaults: { category_code: 'HW', show_in_tabs: true, level_no: 1, sort_no: 1, is_active: true, created_at: new Date() }
    });
    const [catLaptop] = await db.AssetCategory.findOrCreate({
      where: { category_name: 'Laptop', parent_id: catHW.category_id },
      defaults: { category_code: 'LPT', show_in_tabs: true, level_no: 2, sort_no: 1, is_active: true, created_at: new Date() }
    });
    const [catServer] = await db.AssetCategory.findOrCreate({
      where: { category_name: 'Server', parent_id: catHW.category_id },
      defaults: { category_code: 'SRV', show_in_tabs: true, level_no: 2, sort_no: 2, is_active: true, created_at: new Date() }
    });
    const [catCCTV] = await db.AssetCategory.findOrCreate({
      where: { category_name: 'CCTV', parent_id: catHW.category_id },
      defaults: { category_code: 'CCTV', show_in_tabs: true, level_no: 2, sort_no: 3, is_active: true, created_at: new Date() }
    });

    const [catSW] = await db.AssetCategory.findOrCreate({
      where: { category_name: 'Software' },
      defaults: { category_code: 'SW', show_in_tabs: true, level_no: 1, sort_no: 2, is_active: true, created_at: new Date() }
    });
    const [catERP] = await db.AssetCategory.findOrCreate({
      where: { category_name: 'ERP System', parent_id: catSW.category_id },
      defaults: { category_code: 'ERP', show_in_tabs: true, level_no: 2, sort_no: 1, is_active: true, created_at: new Date() }
    });
    const [catDatabase] = await db.AssetCategory.findOrCreate({
      where: { category_name: 'Database', parent_id: catSW.category_id },
      defaults: { category_code: 'DB', show_in_tabs: true, level_no: 2, sort_no: 2, is_active: true, created_at: new Date() }
    });

    const [catNW] = await db.AssetCategory.findOrCreate({
      where: { category_name: 'Networking' },
      defaults: { category_code: 'NW', show_in_tabs: true, level_no: 1, sort_no: 3, is_active: true, created_at: new Date() }
    });
    const [catSwitch] = await db.AssetCategory.findOrCreate({
      where: { category_name: 'Switch Router', parent_id: catNW.category_id },
      defaults: { category_code: 'SWT', show_in_tabs: true, level_no: 2, sort_no: 1, is_active: true, created_at: new Date() }
    });
    const [catAP] = await db.AssetCategory.findOrCreate({
      where: { category_name: 'Access Point', parent_id: catNW.category_id },
      defaults: { category_code: 'AP', show_in_tabs: true, level_no: 2, sort_no: 2, is_active: true, created_at: new Date() }
    });

    const [catCY] = await db.AssetCategory.findOrCreate({
      where: { category_name: 'Cyber' },
      defaults: { category_code: 'CYB', show_in_tabs: true, level_no: 1, sort_no: 4, is_active: true, created_at: new Date() }
    });
    const [catFW] = await db.AssetCategory.findOrCreate({
      where: { category_name: 'Firewall Protection', parent_id: catCY.category_id },
      defaults: { category_code: 'FW', show_in_tabs: true, level_no: 2, sort_no: 1, is_active: true, created_at: new Date() }
    });
    const [catEndpoint] = await db.AssetCategory.findOrCreate({
      where: { category_name: 'Endpoint Protection', parent_id: catCY.category_id },
      defaults: { category_code: 'END', show_in_tabs: true, level_no: 2, sort_no: 2, is_active: true, created_at: new Date() }
    });
    console.log("✓ Seeded Asset Categories");

    // 8. Seed Assets
    const assetsData = [
      { code: 'AST-LPT-001', cat: catLaptop, name: 'ThinkPad T14 QA Tester', host: 'qa-tester-lpt', ip: '192.168.10.45' },
      { code: 'AST-LPT-002', cat: catLaptop, name: 'MacBook Pro Developer', host: 'dev-macbook-01', ip: '192.168.10.46' },
      { code: 'AST-SRV-001', cat: catServer, name: 'Active Directory Core Server', host: 'ad-core-dc', ip: '192.168.10.5' },
      { code: 'AST-SRV-002', cat: catServer, name: 'Local File Storage Server', host: 'nas-storage-local', ip: '192.168.10.6' },
      { code: 'AST-CCTV-001', cat: catCCTV, name: 'Datacenter CCTV Camera', host: 'cctv-dc-cam01', ip: '192.168.10.100' },
      { code: 'AST-ERP-001', cat: catERP, name: 'Production SAP ERP Server', host: 'sap-production-srv', ip: '192.168.10.10' },
      { code: 'AST-DB-001', cat: catDatabase, name: 'Production MS SQL Database', host: 'mssql-prod-db', ip: '192.168.10.11' },
      { code: 'AST-NET-001', cat: catSwitch, name: 'Cisco Catalyst Core Switch', host: 'switch-core-datacenter', ip: '192.168.10.2' },
      { code: 'AST-NET-002', cat: catSwitch, name: 'Ubiquiti UniFi Switch 24P', host: 'switch-floor-1', ip: '192.168.10.3' },
      { code: 'AST-AP-001', cat: catAP, name: 'Lobby AP Wifi', host: 'lobby-ap-wifi', ip: '192.168.10.20' },
      { code: 'AST-FW-001', cat: catFW, name: 'Fortigate 100F Firewall Core', host: 'firewall-core', ip: '192.168.10.1' },
      { code: 'AST-END-001', cat: catEndpoint, name: 'Sophos Security Central Server', host: 'sophos-mgt-console', ip: '192.168.10.25' }
    ];

    const seededAssets = [];
    for (const a of assetsData) {
      const [assetObj] = await db.Asset.findOrCreate({
        where: { asset_code: a.code },
        defaults: {
          category_id: a.cat.category_id,
          location_id: loc.location_id,
          asset_name: a.name,
          serial_number: `SN-${a.code}-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'ACTIVE',
          created_at: new Date(),
          purchase_date: '2025-01-10',
          hostname: a.host,
          ip_main: a.ip
        }
      });
      seededAssets.push(assetObj);
    }
    console.log("✓ Seeded Asset Records");

    // 9. Seed Yearly Standard
    const currentYear = 2026;
    const [yearly] = await db.YearlyStandardMaintenance.findOrCreate({
      where: { tahun: currentYear },
      defaults: {
        judul: `Standar Pemeliharaan Infrastruktur IT ${currentYear}`,
        status_approval: 'APPROVED',
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    console.log("✓ Seeded Yearly Standard Maintenance:", yearly.judul);

    // 10. Seed Standard Maintenances & Standard Check Items
    const standardSpecs = [
      {
        kategori: 'Hardware',
        subKategori: 'Laptop',
        namaPerangkat: 'Laptop',
        tipePerangkat: 'ThinkPad',
        checks: [
          { pengecekan: 'Check keyboard & trackpad', standard: 'Semua tombol berfungsi normal', periodik: '1X/W', bagian: 'Input Devices', metode: 'Pengujian ketikan langsung', alat: 'Keyboard Test Utility' },
          { pengecekan: 'Pembersihan debu & fan', standard: 'Bebas debu & sirkulasi fan lancar', periodik: '1 Bulan', bagian: 'Casing & Heat Sink', metode: 'Kuas halus & blower', alat: 'Blower & Kuas' }
        ]
      },
      {
        kategori: 'Hardware',
        subKategori: 'Server',
        namaPerangkat: 'Server Rackmount',
        tipePerangkat: 'PowerEdge',
        checks: [
          { pengecekan: 'Check physical disks health', standard: 'Status LED disk hijau, tidak ada alarm', periodik: '1X/W', bagian: 'Disk Controller', metode: 'Visual & IDRAC review', alat: 'iDRAC Dashboard' },
          { pengecekan: 'Check backup configuration status', standard: 'Status backup harian SUCCESS', periodik: '2X/W', bagian: 'Backup OS', metode: 'Review logs Veeam', alat: 'Veeam Console' }
        ]
      },
      {
        kategori: 'Hardware',
        subKategori: 'CCTV',
        namaPerangkat: 'CCTV Camera',
        tipePerangkat: 'IP Camera Dome',
        checks: [
          { pengecekan: 'Pemeriksaan rekaman & DVR', standard: 'Rekaman 30 hari tersimpan normal', periodik: '1X/W', bagian: 'Storage DVR', metode: 'Playback test & free space check', alat: 'NVR Client Web' }
        ]
      },
      {
        kategori: 'Software',
        subKategori: 'ERP System',
        namaPerangkat: 'ERP System',
        tipePerangkat: 'SAP ERP',
        checks: [
          { pengecekan: 'Review transaction error logs', standard: 'Tidak ada status failure pada batch jobs', periodik: '1X/W', bagian: 'Application Layer', metode: 'Transaction code ST22 review', alat: 'SAP GUI' },
          { pengecekan: 'Database size review & shrinkage', standard: 'Free storage space > 20%', periodik: '1 Bulan', bagian: 'Storage Layer', metode: 'SQL Disk usage report', alat: 'SQL Management Studio' }
        ]
      },
      {
        kategori: 'Software',
        subKategori: 'Database',
        namaPerangkat: 'Database Server',
        tipePerangkat: 'MS SQL Server',
        checks: [
          { pengecekan: 'Index reorganization & stats', standard: 'Fragmentasi index < 10%', periodik: '1 Bulan', bagian: 'SQL Indexes', metode: 'Rebuild & Reorganize query execution', alat: 'SQL Job Scheduler' }
        ]
      },
      {
        kategori: 'Networking',
        subKategori: 'Switch Router',
        namaPerangkat: 'Core Switch',
        tipePerangkat: 'Cisco Catalyst',
        checks: [
          { pengecekan: 'Check port status & link load', standard: 'Load utilitas port di bawah 70%', periodik: '1X/W', bagian: 'Port Interfaces', metode: 'SNMP query & SolarWinds logs', alat: 'SolarWinds Monitoring' },
          { pengecekan: 'Firmware update review', standard: 'Menggunakan Cisco IOS recommended stable release', periodik: '6 Bulan', bagian: 'Cisco IOS Image', metode: 'Cisco support portal compatibility verification', alat: 'CLI SSH Console' }
        ]
      },
      {
        kategori: 'Networking',
        subKategori: 'Access Point',
        namaPerangkat: 'Access Point AP',
        tipePerangkat: 'Ubiquiti AP',
        checks: [
          { pengecekan: 'Test user authentication latency', standard: 'Maksimal latency DHCP lease < 3 detik', periodik: '2X/W', bagian: 'WLAN Auth', metode: 'Test connection from admin device', alat: 'Unifi Controller' }
        ]
      },
      {
        kategori: 'Cyber',
        subKategori: 'Firewall Protection',
        namaPerangkat: 'Firewall Core',
        tipePerangkat: 'FortiGate 100F',
        checks: [
          { pengecekan: 'Review blocked attempts & logs', standard: 'Intrusion prevention logs aman & ter-filter', periodik: '1X/W', bagian: 'Security Profiles', metode: 'FortiView logs review', alat: 'FortiOS Dashboard' },
          { pengecekan: 'SSL VPN user access audit', standard: 'Hanya user terdaftar aktif yang login', periodik: '1X/W', bagian: 'VPN SSL Access', metode: 'Export report active VPN users', alat: 'FortiAnalyzer' }
        ]
      },
      {
        kategori: 'Cyber',
        subKategori: 'Endpoint Protection',
        namaPerangkat: 'Sophos Endpoint Server',
        tipePerangkat: 'Endpoint Protection Agent',
        checks: [
          { pengecekan: 'Verify definition update status', standard: '100% agent running update terbaru < 24 jam', periodik: '2X/W', bagian: 'Endpoint Client Agent', metode: 'Sophos central cloud device audit', alat: 'Sophos Central Dashboard' }
        ]
      }
    ];

    for (const spec of standardSpecs) {
      const [sm] = await db.StandardMaintenance.findOrCreate({
        where: {
          yearly_standard_id: yearly.id,
          kategori: spec.kategori,
          subKategori: spec.subKategori
        },
        defaults: {
          namaPerangkat: spec.namaPerangkat,
          tipePerangkat: spec.tipePerangkat,
          subPerangkat: '-',
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      // Seed Standard Detail
      const [detail] = await db.StandardMaintenanceDetail.findOrCreate({
        where: { standard_maintenance_id: sm.id, fungsi: 'Pemeriksaan Kesehatan Perangkat' },
        defaults: {
          deskripsi: `SOP pemeriksaan periodik menyeluruh untuk perangkat ${spec.namaPerangkat}`,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      // Seed checks and schedules
      const createdChecks = [];
      for (const checkSpec of spec.checks) {
        const [check] = await db.StandardMaintenanceCheck.findOrCreate({
          where: { standard_maintenance_detail_id: detail.id, pengecekan: checkSpec.pengecekan },
          defaults: {
            standard: checkSpec.standard,
            periodik: checkSpec.periodik,
            bagian: checkSpec.bagian,
            metode: checkSpec.metode,
            alat: checkSpec.alat,
            created_at: new Date(),
            updated_at: new Date()
          }
        });
        createdChecks.push(check);
      }

      // Find matching assets and generate schedules
      const categoryObj = await db.AssetCategory.findOne({ where: { category_name: spec.subKategori }, raw: true });
      if (categoryObj) {
        const assets = await db.Asset.findAll({ where: { category_id: categoryObj.category_id }, raw: true });
        for (const asset of assets) {
          const [schedule] = await db.MaintenanceSchedule.findOrCreate({
            where: {
              asset_id: asset.asset_id,
              yearly_standard_id: yearly.id,
              standard_maintenance_id: sm.id
            },
            defaults: {
              periodik: spec.checks[0].periodik, // default to first check periodicity
              status: 'ACTIVE'
            }
          });

          // Generate check cells
          const actualRecords = [];
          for (const check of createdChecks) {
            const dates = await generateCheckboxDates(currentYear, check.periodik);
            for (const date of dates) {
              actualRecords.push({
                schedule_id: schedule.id,
                check_id: check.id,
                tanggal: date,
                status: 'PLAN',
                legend: '□',
                created_at: new Date(),
                updated_at: new Date()
              });
            }
          }

          if (actualRecords.length > 0) {
            await db.MaintenanceActual.bulkCreate(actualRecords);
            
            // Fetch created actuals to selectively modify some as Done/Abnormal
            const createdActuals = await db.MaintenanceActual.findAll({
              where: { schedule_id: schedule.id }
            });

            // Set first 3 checks to Done (✓)
            for (let i = 0; i < Math.min(createdActuals.length, 3); i++) {
              await createdActuals[i].update({
                status: 'ACTUAL',
                legend: '✓'
              });
            }

            // Set one check to Abnormal (✗) on Laptop T14 for testing
            if (asset.asset_code === 'AST-LPT-001' && createdActuals.length > 3) {
              const abnormalCell = createdActuals[3];
              await abnormalCell.update({
                status: 'ABNORMAL',
                legend: '✗'
              });

              await db.MaintenanceAbnormalLog.findOrCreate({
                where: { actual_id: abnormalCell.id },
                defaults: {
                  deskripsi_kerusakan: 'Laptop mengalami overheating parah saat membuka visual studio. Kipas berbunyi bising.',
                  tindakan: 'Pembersihan ulang pasta thermal processor dan pembersihan kipas internal.',
                  status_temuan: 'OPEN',
                  created_at: new Date(),
                  updated_at: new Date()
                }
              });

              await db.MaintenanceLogSheet.findOrCreate({
                where: { actual_id: abnormalCell.id },
                defaults: {
                  schedule_id: schedule.id,
                  temuan: 'Laptop overheating, kipas bising.',
                  tindakan: 'Pembersihan pasta thermal.',
                  status_temuan: 'OPEN',
                  tanggal_temuan: new Date(),
                  created_by: user1.user_id
                }
              });
            }
          }
        }
      }
    }

    console.log("Seeding process completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error during seeding process:", error);
    process.exit(1);
  }
}

seed();
