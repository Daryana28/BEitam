import { sequelize } from './src/models/index.js';

async function test() {
  const tableDesc = await sequelize.getQueryInterface().describeTable('standard_maintenances');
  console.log("standard_maintenances columns:", Object.keys(tableDesc));
  
  const catDesc = await sequelize.getQueryInterface().describeTable('categories');
  console.log("categories columns:", Object.keys(catDesc));
  
  process.exit();
}
test();
