import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define(
    "MaintenanceAbnormalLog",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      actual_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      deskripsi_kerusakan: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      tindakan: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status_temuan: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "OPEN",
      },
      resolved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      resolved_by: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
      },
      updated_at: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: "maintenance_abnormal_logs",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
};
