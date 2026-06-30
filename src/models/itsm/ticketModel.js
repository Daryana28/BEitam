// be\src\models\ticketModel.js
import { DataTypes } from "sequelize";

export default (sequelize) =>
  sequelize.define(
    "Ticket",
    {
      ticket_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      requester_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      assigned_to: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING(250),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      priority: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "tickets",
      timestamps: false,
      freezeTableName: true,
    }
  );