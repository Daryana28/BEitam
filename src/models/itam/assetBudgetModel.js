import { DataTypes } from "sequelize";

export default (sequelize) =>
 sequelize.define(
  "AssetBudget",
  {
   id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
   },
   budget_code: {
    type: DataTypes.STRING(100),
    allowNull: false,
   },
   subject: {
    type: DataTypes.STRING(255),
    allowNull: true,
   },
   initial_plan: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
   },
   review: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
   },
   item_no: {
    type: DataTypes.STRING(100),
    allowNull: true,
   },
   item_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
   },
   factory: {
    type: DataTypes.STRING(100),
    allowNull: true,
   },
   vehicle_type: {
    type: DataTypes.STRING(100),
    allowNull: true,
   },
   qty: {
    type: DataTypes.INTEGER,
    allowNull: true,
   },
   purpose: {
    type: DataTypes.STRING(100),
    allowNull: true,
   },
   sale: {
    type: DataTypes.STRING(100),
    allowNull: true,
   },
   currency: {
    type: DataTypes.STRING(50),
    allowNull: true,
   },
   price_pengajuan: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
   },
   purchase_price: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
   },
   rate: {
    type: DataTypes.STRING(50),
    allowNull: true,
   },
   budget: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
   },
   po_date: {
    type: DataTypes.STRING(10),
    allowNull: true,
   },
   ship_date: {
    type: DataTypes.STRING(10),
    allowNull: true,
   },
   acceptance_month: {
    type: DataTypes.STRING(10),
    allowNull: true,
   },
   payment_condition: {
    type: DataTypes.STRING(255),
    allowNull: true,
   },
   payment_date_1: {
    type: DataTypes.STRING(10),
    allowNull: true,
   },
   payment_rate_1: {
    type: DataTypes.STRING(50),
    allowNull: true,
   },
   payment_amount_1: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
   },
   payment_date_2: {
    type: DataTypes.STRING(10),
    allowNull: true,
   },
   payment_rate_2: {
    type: DataTypes.STRING(50),
    allowNull: true,
   },
   payment_amount_2: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
   },
   payment_date_3: {
    type: DataTypes.STRING(10),
    allowNull: true,
   },
   payment_rate_3: {
    type: DataTypes.STRING(50),
    allowNull: true,
   },
   payment_amount_3: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
   },
   mass_pro_timing: {
    type: DataTypes.STRING(10),
    allowNull: true,
   },
   capitalized_month: {
    type: DataTypes.STRING(10),
    allowNull: true,
   },
   created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
   },
   updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
   },
  },
  {
   tableName: "asset_budgets",
   timestamps: true,
   createdAt: "created_at",
   updatedAt: "updated_at",
   freezeTableName: true,
  }
 );
