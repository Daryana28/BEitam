// be\src\models\legacy\assetLifecycleModel.js
import {
 DataTypes,
} from "sequelize";

export default function (
 sequelize
) {
 return sequelize.define(
  "AssetLifecycle",
  {
   lifecycle_id: {
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

   action_name: {
    type:
     DataTypes.STRING(
      50
     ),
    allowNull: false,
   },

   from_location: {
    type:
     DataTypes.STRING(
      200
     ),
    allowNull: true,
   },

   to_location: {
    type:
     DataTypes.STRING(
      200
     ),
    allowNull: true,
   },

   notes: {
    type:
     DataTypes.TEXT,
    allowNull: true,
   },

   created_by: {
    type:
     DataTypes.BIGINT,
    allowNull: true,
   },

   created_at: {
    type:
     DataTypes.DATE,
    allowNull: false,
    defaultValue:
     DataTypes.NOW,
   },
  },
  {
   tableName:
    "asset_lifecycles",
   timestamps: false,
  }
 );
}