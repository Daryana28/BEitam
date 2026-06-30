import { DataTypes } from "sequelize";

export default (sequelize) =>
  sequelize.define(
    "YearlyStandardMaintenance",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      tahun: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      judul: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      status_approval: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'DRAFT',
      },
      alasan_hapus: {
        type: DataTypes.STRING,
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
      tableName: "yearly_standard_maintenances",
      timestamps: false,
      freezeTableName: true,
    }
  );
