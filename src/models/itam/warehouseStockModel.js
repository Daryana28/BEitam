// be\src\models\warehouseStockModel.js
import { DataTypes } from "sequelize";

export default (sequelize) =>
  sequelize.define(
    "WarehouseStock",
    {
      stock_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      part_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      qty: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
      },
    },
    {
      tableName: "warehouse_stock",
      timestamps: false,
      freezeTableName: true,
    }
  );