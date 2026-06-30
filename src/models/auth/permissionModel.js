// be\src\models\permissionModel.js
import { DataTypes } from "sequelize";

export default (sequelize) =>
  sequelize.define(
    "Permission",
    {
      permission_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      permission_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
    },
    {
      tableName: "permissions",
      timestamps: false,
      freezeTableName: true,
    }
  );