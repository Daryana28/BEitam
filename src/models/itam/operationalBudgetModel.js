import { DataTypes } from "sequelize";

export default (sequelize) =>
 sequelize.define(
  "OperationalBudget",
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
   budget_code: {
    type: DataTypes.STRING(150),
    allowNull: false,
   },
   cost_code: {
    type: DataTypes.STRING(100),
    allowNull: true,
   },
   acct_budget: {
    type: DataTypes.STRING(100),
    allowNull: true,
   },
   large_account: {
    type: DataTypes.STRING(100),
    allowNull: true,
   },
   cost_code_1: {
    type: DataTypes.STRING(100),
    allowNull: true,
   },
   dept_sect: {
    type: DataTypes.STRING(150),
    allowNull: true,
   },
   acc_no: {
    type: DataTypes.STRING(100),
    allowNull: true,
   },
   acc_desc: {
    type: DataTypes.STRING(255),
    allowNull: true,
   },
   item_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
   },
   reason: {
    type: DataTypes.STRING(255),
    allowNull: true,
   },
   initial_budget_plan: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
   },
   initial_budget_actual: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
   },
   jan_plan: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
   jan_actual: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
   feb_plan: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
   feb_actual: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
   mar_plan: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
   mar_actual: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
   apr_plan: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
   apr_actual: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
   may_plan: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
   may_actual: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
   jun_plan: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
   jun_actual: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
   jul_plan: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
   jul_actual: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
   aug_plan: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
   aug_actual: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
   sep_plan: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
   sep_actual: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
   oct_plan: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
   oct_actual: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
   nov_plan: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
   nov_actual: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
   dec_plan: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
   dec_actual: { type: DataTypes.DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
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
   tableName: "operational_budgets",
   timestamps: true,
   createdAt: "created_at",
   updatedAt: "updated_at",
   freezeTableName: true,
  }
 );
