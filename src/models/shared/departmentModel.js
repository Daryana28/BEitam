// be\src\models\departmentModel.js
import { DataTypes } from "sequelize";

export default (sequelize) =>
  sequelize.define(
    "Department",
    {
      department_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      company_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      department_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      department_name: {
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
      tableName: "departments",
      timestamps: false,
      freezeTableName: true,
    }
  );