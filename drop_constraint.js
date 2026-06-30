import 'dotenv/config';
import db from './src/models/index.js';

const dropConstraint = async () => {
  try {
    const sequelize = db.sequelize;
    
    console.log("Dropping constraint UQ__asset_ca__5189E25547A9BCED...");
    await sequelize.query(`ALTER TABLE asset_categories DROP CONSTRAINT UQ__asset_ca__5189E25547A9BCED;`);
    console.log("Constraint successfully dropped.");
    
    process.exit(0);
  } catch (error) {
    console.error("Failed to drop constraint:", error.message);
    process.exit(1);
  }
};

dropConstraint();
