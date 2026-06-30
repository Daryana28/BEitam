// be\src\models\userRoleModel.js
import { DataTypes } from "sequelize";

export default (sequelize) =>
  sequelize.define(
    "UserRole",
    {
      user_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
      },
      role_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
      },
    },
    {
      tableName: "user_roles",
      timestamps: false,
      freezeTableName: true,
    }
  );