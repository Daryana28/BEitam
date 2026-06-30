// be\src\config\db\db.js
import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 1433),
    dialect: "mssql",
    dialectOptions: {
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
    },
    logging: false,
    pool: {
      max: 10,
      min: 0,
      idle: 10000,
    },
    define: {
      freezeTableName: true,
      timestamps: false,
    },
  }
);

export default sequelize;