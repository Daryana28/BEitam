// be\src\models\assetLocationModel.js
import { DataTypes } from "sequelize";

export default (sequelize) =>
  sequelize.define(
    "AssetLocation",
    {
      location_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      location_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
    },
    {
      tableName: "asset_locations",
      timestamps: false,
      freezeTableName: true,
    }
  );