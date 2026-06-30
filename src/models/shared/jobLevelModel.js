import { DataTypes } from "sequelize";

export default (sequelize) =>
  sequelize.define(
    "JobLevel",
    {
      level_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      level_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      rank_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: "job_levels",
      timestamps: false,
      freezeTableName: true,
    }
  );
