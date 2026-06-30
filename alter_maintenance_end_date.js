import 'dotenv/config';
import sequelize from './src/config/db/db.js';

const run = async () => {
  try {
    console.log('Adding next_maintenance_end_date...');
    await sequelize.query('ALTER TABLE maintenance_schedules ADD next_maintenance_end_date DATETIME;');
    console.log('Success');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
run();
