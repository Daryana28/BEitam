import 'dotenv/config';
import sequelize from '../config/db/db.js';

const run = async () => {
  try {
    console.log('Starting DB refactoring migrations...');

    // 1. Add columns to maintenance_schedules if they don't exist
    console.log('Altering maintenance_schedules table...');
    try {
      await sequelize.query(`
        IF NOT EXISTS (
          SELECT * FROM sys.columns 
          WHERE object_id = OBJECT_ID('dbo.maintenance_schedules') AND name = 'periodik_type'
        )
        BEGIN
          ALTER TABLE dbo.maintenance_schedules ADD periodik_type NVARCHAR(50) NULL;
        END
      `);
      await sequelize.query(`
        IF NOT EXISTS (
          SELECT * FROM sys.columns 
          WHERE object_id = OBJECT_ID('dbo.maintenance_schedules') AND name = 'periodik_freq'
        )
        BEGIN
          ALTER TABLE dbo.maintenance_schedules ADD periodik_freq INT DEFAULT 1 NULL;
        END
      `);
      await sequelize.query(`
        IF NOT EXISTS (
          SELECT * FROM sys.columns 
          WHERE object_id = OBJECT_ID('dbo.maintenance_schedules') AND name = 'periodik_unit'
        )
        BEGIN
          ALTER TABLE dbo.maintenance_schedules ADD periodik_unit NVARCHAR(10) DEFAULT 'w' NULL;
        END
      `);
      console.log('Successfully altered maintenance_schedules.');
    } catch (err) {
      console.warn('Warning altering maintenance_schedules:', err.message);
    }

    // 2. Create maintenance_actual table
    console.log('Creating maintenance_actual table...');
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('dbo.maintenance_actual') AND type in (N'U'))
      BEGIN
        CREATE TABLE dbo.maintenance_actual (
          id BIGINT IDENTITY(1,1) NOT NULL,
          schedule_id BIGINT NOT NULL,
          check_id BIGINT NOT NULL,
          tanggal DATE NOT NULL,
          status NVARCHAR(20) DEFAULT 'PLAN',
          legend NVARCHAR(10) DEFAULT '□',
          created_by BIGINT NULL,
          created_at DATETIMEOFFSET DEFAULT GETDATE(),
          updated_at DATETIMEOFFSET DEFAULT GETDATE(),
          CONSTRAINT PK_maintenance_actual PRIMARY KEY (id),
          CONSTRAINT UQ_maintenance_actual UNIQUE (schedule_id, check_id, tanggal),
          CONSTRAINT FK_mnt_actual_schedule FOREIGN KEY (schedule_id) 
              REFERENCES dbo.maintenance_schedules(id) ON DELETE CASCADE,
          CONSTRAINT FK_mnt_actual_check FOREIGN KEY (check_id) 
              REFERENCES dbo.standard_maintenance_checks(id),
          CONSTRAINT FK_mnt_actual_user FOREIGN KEY (created_by)
              REFERENCES dbo.users(user_id)
        );
      END
    `);
    console.log('Table maintenance_actual verified/created.');

    // 3. Create maintenance_abnormal_logs table
    console.log('Creating maintenance_abnormal_logs table...');
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('dbo.maintenance_abnormal_logs') AND type in (N'U'))
      BEGIN
        CREATE TABLE dbo.maintenance_abnormal_logs (
          id BIGINT IDENTITY(1,1) NOT NULL,
          actual_id BIGINT NOT NULL,
          deskripsi_kerusakan NVARCHAR(MAX) NOT NULL,
          tindakan NVARCHAR(MAX) NOT NULL,
          status_temuan NVARCHAR(50) DEFAULT 'OPEN',
          resolved_at DATETIMEOFFSET NULL,
          resolved_by BIGINT NULL,
          created_at DATETIMEOFFSET DEFAULT GETDATE(),
          updated_at DATETIMEOFFSET DEFAULT GETDATE(),
          CONSTRAINT PK_maintenance_abnormal_logs PRIMARY KEY (id),
          CONSTRAINT FK_mnt_abnormal_actual FOREIGN KEY (actual_id) 
              REFERENCES dbo.maintenance_actual(id) ON DELETE CASCADE,
          CONSTRAINT FK_mnt_abnormal_user FOREIGN KEY (resolved_by)
              REFERENCES dbo.users(user_id)
        );
      END
    `);
    console.log('Table maintenance_abnormal_logs verified/created.');

    // 4. Modify maintenance_log_sheets table
    console.log('Altering maintenance_log_sheets table...');
    try {
      await sequelize.query(`
        IF NOT EXISTS (
          SELECT * FROM sys.columns 
          WHERE object_id = OBJECT_ID('dbo.maintenance_log_sheets') AND name = 'actual_id'
        )
        BEGIN
          ALTER TABLE dbo.maintenance_log_sheets ADD actual_id BIGINT NULL;
        END
      `);
      await sequelize.query(`
        IF NOT EXISTS (
          SELECT * FROM sys.foreign_keys 
          WHERE object_id = OBJECT_ID('dbo.FK_mnt_log_actual') AND parent_object_id = OBJECT_ID('dbo.maintenance_log_sheets')
        )
        BEGIN
          ALTER TABLE dbo.maintenance_log_sheets ADD CONSTRAINT FK_mnt_log_actual 
            FOREIGN KEY (actual_id) REFERENCES dbo.maintenance_actual(id);
        END
      `);
      console.log('Successfully altered maintenance_log_sheets.');
    } catch (err) {
      console.warn('Warning altering maintenance_log_sheets:', err.message);
    }

    console.log('All DB migrations executed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

run();
