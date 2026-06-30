import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const syncDatabase = async () => {
  try {
    const { default: sequelize } = await import('./src/config/db/db.js');
    const { default: models } = await import('./src/models/index.js');

    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Syncing MaintenanceLogSheet table...');
    await models.MaintenanceLogSheet.sync({ alter: true });
    console.log('MaintenanceLogSheet table synced successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error syncing database:', error);
    process.exit(1);
  }
};

syncDatabase();
