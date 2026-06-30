import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define(
    "MaintenanceLogSheet",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      schedule_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      temuan: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      tindakan: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status_temuan: {
        type: DataTypes.STRING(50),
        defaultValue: 'OPEN',
      },
      tanggal_temuan: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      created_by: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      actual_id: {
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
      tableName: "maintenance_log_sheets",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
};
