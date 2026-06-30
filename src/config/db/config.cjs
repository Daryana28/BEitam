// be\src\config\db\config.cjs
require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "itam_dev",
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    dialect: "mysql",
    logging: false,
    timezone: "+07:00",
    define: {
      underscored: true,
      freezeTableName: true,
      timestamps: true,
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },

  test: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME_TEST || "itam_test",
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    dialect: "mysql",
    logging: false,
    timezone: "+07:00",
    define: {
      underscored: true,
      freezeTableName: true,
      timestamps: true,
    },
  },

  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    dialect: "mysql",
    logging: false,
    timezone: "+07:00",
    define: {
      underscored: true,
      freezeTableName: true,
      timestamps: true,
    },
    pool: {
      max: 20,
      min: 2,
      acquire: 60000,
      idle: 10000,
    },
  },
};