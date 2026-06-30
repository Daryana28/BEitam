import 'dotenv/config';
import sequelize from './src/config/db/db.js';

const run = async () => {
  try {
    console.log('Altering next_maintenance_date to DATETIME...');
    await sequelize.query('ALTER TABLE maintenance_schedules ALTER COLUMN next_maintenance_date DATETIME;');
    console.log('Success');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
run();
