// be\src\models\companyModel.js
import { DataTypes } from "sequelize";

export default (sequelize) =>
  sequelize.define(
    "Company",
    {
      company_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      company_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      company_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "companies",
      timestamps: false,
      freezeTableName: true,
    }
  );