// be\src\models\roleModel.js
import { DataTypes } from "sequelize";

export default (sequelize) =>
  sequelize.define(
    "Role",
    {
      role_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      role_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
    },
    {
      tableName: "roles",
      timestamps: false,
      freezeTableName: true,
    }
  );