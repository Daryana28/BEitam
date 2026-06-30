import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define(
    "MaintenanceActual",
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
      check_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      tanggal: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "PLAN",
      },
      legend: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "□",
      },
      created_by: {
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
      tableName: "maintenance_actual",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
};
