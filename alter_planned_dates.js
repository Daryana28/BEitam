import 'dotenv/config';
import sequelize from './src/config/db/db.js';

const run = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("Altering standard_maintenance_checks table...");
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'standard_maintenance_checks' AND COLUMN_NAME = 'planned_dates')
      ALTER TABLE standard_maintenance_checks ADD planned_dates NVARCHAR(MAX) NULL;
    `, { transaction });

    await transaction.commit();
    console.log("✓ Database column planned_dates added successfully.");
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error("Database Alteration Error:", error);
    process.exit(1);
  }
};
run();
