import 'dotenv/config';
import sequelize from './src/config/db/db.js';
import models from './src/models/index.js';

const syncDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Syncing database...');
    await models.Holiday.sync({ alter: true });
    console.log('Database synced successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error syncing database:', error);
    process.exit(1);
  }
};

syncDatabase();
