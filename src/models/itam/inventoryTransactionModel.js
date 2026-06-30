// be\src\models\inventoryTransactionModel.js
import { DataTypes } from "sequelize";

export default (sequelize) =>
  sequelize.define(
    "InventoryTransaction",
    {
      trx_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      part_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      wo_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      trx_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      qty: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "inventory_transactions",
      timestamps: false,
      freezeTableName: true,
    }
  );