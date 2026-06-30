// be\src\models\itam\assetFileModel.js
import {
 DataTypes,
} from "sequelize";

export default (
 sequelize
) =>
 sequelize.define(
  "AssetFile",
  {
   file_id: {
    type:
     DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
   },
   asset_id: {
    type:
     DataTypes.UUID,
    allowNull: false,
   },
   file_type: {
    type:
     DataTypes.STRING(
      30
     ),
    allowNull: false,
   },
   file_name: {
    type:
     DataTypes.STRING(
      255
     ),
    allowNull: false,
   },
   file_path: {
    type:
     DataTypes.STRING(
      500
     ),
    allowNull: false,
   },
   file_ext: {
    type:
     DataTypes.STRING(
      20
     ),
   },
   file_size: {
    type:
     DataTypes.BIGINT,
   },
   uploaded_by: {
    type:
     DataTypes.BIGINT,
   },
   created_at: {
    type:
     DataTypes.DATE,
   },
  },
  {
   tableName:
    "asset_files",
   timestamps: false,
  }
 );