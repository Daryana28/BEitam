import db from './src/models/index.js';

const checkConstraints = async () => {
  const sequelize = db.sequelize;
  const [results] = await sequelize.query(`
    SELECT tc.CONSTRAINT_NAME, tc.CONSTRAINT_TYPE, kcu.COLUMN_NAME 
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc 
    JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu 
    ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME 
    WHERE tc.TABLE_NAME = 'asset_categories'
  `);
  console.log(results);
  process.exit(0);
};

checkConstraints().catch(console.error);
