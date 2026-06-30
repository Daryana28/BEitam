// be\src\models\rolePermissionModel.js
import { DataTypes } from "sequelize";

export default (sequelize) =>
  sequelize.define(
    "RolePermission",
    {
      role_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
      },
      permission_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
      },
    },
    {
      tableName: "role_permissions",
      timestamps: false,
      freezeTableName: true,
    }
  );