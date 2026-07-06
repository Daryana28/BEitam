import { DataTypes } from "sequelize";

export default (sequelize) =>
 sequelize.define(
  "AssetBudgetScheduleItem",
  {
   id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
   },
   client_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
   },
   display_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
   },
   budget_code: {
    type: DataTypes.STRING(100),
    allowNull: false,
   },
   subject: {
    type: DataTypes.STRING(255),
    allowNull: true,
   },
   item_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
   },
   item_no: {
    type: DataTypes.STRING(50),
    allowNull: true,
   },
   budget_plan_amount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
   },
   actual_budget_amount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
   },
   borrowed_from_budget_code: {
    type: DataTypes.STRING(100),
    allowNull: true,
   },
   borrowed_amount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
   },
   transfer_date: {
    type: DataTypes.STRING(20),
    allowNull: true,
   },
   borrow_purpose: {
    type: DataTypes.STRING(255),
    allowNull: true,
   },
   borrow_remark: {
    type: DataTypes.STRING(255),
    allowNull: true,
   },
   po_time: {
    type: DataTypes.STRING(20),
    allowNull: true,
   },
   allocation: {
    type: DataTypes.STRING(100),
    allowNull: true,
   },
   budget_year: {
    type: DataTypes.STRING(10),
    allowNull: false,
   },
   current_stage: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: "All",
   },
   stages_json: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: "{}",
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
   tableName: "asset_budget_schedule_items",
   timestamps: true,
   createdAt: "created_at",
   updatedAt: "updated_at",
   freezeTableName: true,
  }
 );
