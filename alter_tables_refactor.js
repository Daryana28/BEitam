import 'dotenv/config';
import sequelize from './src/config/db/db.js';

const run = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("Altering tables...");
    
    // Add columns to standard_maintenances
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'standard_maintenances' AND COLUMN_NAME = 'source_file')
      ALTER TABLE standard_maintenances ADD source_file NVARCHAR(255) NULL;
    `, { transaction });

    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'standard_maintenances' AND COLUMN_NAME = 'imported_by')
      ALTER TABLE standard_maintenances ADD imported_by BIGINT NULL;
    `, { transaction });

    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'standard_maintenances' AND COLUMN_NAME = 'imported_at')
      ALTER TABLE standard_maintenances ADD imported_at DATETIMEOFFSET NULL;
    `, { transaction });

    // Add columns to users
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'profile_picture')
      ALTER TABLE users ADD profile_picture NVARCHAR(500) NULL;
    `, { transaction });

    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'phone')
      ALTER TABLE users ADD phone NVARCHAR(30) NULL;
    `, { transaction });

    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'must_change_password')
      ALTER TABLE users ADD must_change_password BIT NOT NULL DEFAULT 1;
    `, { transaction });

    await transaction.commit();
    console.log("✓ DB Alterations completed successfully.");
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error("DB Alteration Error:", error);
    process.exit(1);
  }
};
run();
