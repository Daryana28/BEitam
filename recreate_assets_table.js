import 'dotenv/config';
import sequelize from './src/config/db/db.js';
import models from './src/models/index.js';

async function run() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    
    console.log('Dropping related tables...');
    await models.AssetLifecycle.drop();
    await models.AssetFile.drop();
    await models.MaintenanceSchedule.drop();
    await models.WorkOrder.drop();
    await models.Asset.drop();
    
    console.log('Recreating tables with new schema (UUID)...');
    await models.Asset.sync({ force: true });
    await models.WorkOrder.sync({ force: true });
    await models.MaintenanceSchedule.sync({ force: true });
    await models.AssetFile.sync({ force: true });
    await models.AssetLifecycle.sync({ force: true });

    console.log('Successfully dropped and recreated assets tables with UUID primary key!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

run();
