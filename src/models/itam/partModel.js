// be\src\models\partModel.js
import { DataTypes } from "sequelize";

export default (sequelize) =>
  sequelize.define(
    "Part",
    {
      part_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      part_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      part_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
    },
    {
      tableName: "parts",
      timestamps: false,
      freezeTableName: true,
    }
  );