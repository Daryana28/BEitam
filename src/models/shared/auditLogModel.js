// be\src\models\auditLogModel.js
import { DataTypes } from "sequelize";

export default (sequelize) =>
  sequelize.define(
    "AuditLog",
    {
      log_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      module_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      action_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      ref_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "audit_logs",
      timestamps: false,
      freezeTableName: true,
    }
  );