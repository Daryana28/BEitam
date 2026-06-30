import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define(
    "MaintenanceSchedule",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      asset_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      yearly_standard_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      standard_maintenance_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      periodik: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      next_maintenance_date: {
        type: DataTypes.DATE,
      },
      next_maintenance_end_date: {
        type: DataTypes.DATE,
      },
      status: {
        type: DataTypes.STRING(20),
        defaultValue: 'ACTIVE',
      },
      cancel_reason: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      periodik_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      periodik_freq: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      periodik_unit: {
        type: DataTypes.STRING(10),
        allowNull: true,
        defaultValue: 'w',
      },

      created_at: {
        type: DataTypes.DATE,
      },
      updated_at: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: "maintenance_schedules",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
};
