// be\src\models\workOrderModel.js
import { DataTypes } from "sequelize";

export default (sequelize) =>
  sequelize.define(
    "WorkOrder",
    {
      wo_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      ticket_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      asset_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      request_by: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      assigned_to: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      wo_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(250),
        allowNull: false,
      },
      priority: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "work_orders",
      timestamps: false,
      freezeTableName: true,
    }
  );