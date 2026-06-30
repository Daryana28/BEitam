// be\src\models\assetCategoryModel.js
import { DataTypes } from "sequelize";

export default (sequelize) =>
 sequelize.define(
  "AssetCategory",
  {
   category_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
   },
   category_name: {
    type: DataTypes.STRING(150),
    allowNull: false,
   },
   parent_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
   },
   category_code: {
    type: DataTypes.STRING(50),
   },
   show_in_tabs: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
   },
   level_no: {
    type: DataTypes.INTEGER,
   },
   sort_no: {
    type: DataTypes.INTEGER,
   },
   is_active: {
    type: DataTypes.BOOLEAN,
   },
   created_at: {
    type: DataTypes.DATE,
   },
  },
  {
   tableName:
    "asset_categories",
   timestamps: false,
   freezeTableName: true,
  }
 );