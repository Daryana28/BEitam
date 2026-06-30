import { DataTypes } from "sequelize";

export default (sequelize) =>
  sequelize.define(
    "StandardMaintenanceDetail",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      standard_maintenance_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      fungsi: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      deskripsi: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "standard_maintenance_details",
      timestamps: false,
      freezeTableName: true,
    }
  );
