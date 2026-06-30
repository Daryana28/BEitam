// be/src/models/itam/assetModel.js
import { DataTypes } from "sequelize";

export default (sequelize) =>
 sequelize.define(
  "Asset",
  {
   asset_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
   },

   category_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
   },

   location_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
   },

   asset_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
   },

   asset_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
   },

   serial_number: {
    type: DataTypes.STRING(100),
    allowNull: true,
   },

   status: {
    type: DataTypes.STRING(30),
    allowNull: false,
   },

   purchase_date: {
    type:
     DataTypes.DATEONLY,
    allowNull: true,
   },

   depreciation_date: {
    type:
     DataTypes.DATEONLY,
    allowNull: true,
   },

   division: {
    type:
     DataTypes.STRING(
      200
     ),
    allowNull: true,
   },

   department: {
    type:
     DataTypes.STRING(
      200
     ),
    allowNull: true,
   },

   owner_name: {
    type:
     DataTypes.STRING(
      200
     ),
    allowNull: true,
   },

   nik: {
    type:
     DataTypes.STRING(
      30
     ),
    allowNull: true,
   },

   hostname: {
    type:
     DataTypes.STRING(
      100
     ),
    allowNull: true,
   },

   ip_main: {
    type:
     DataTypes.STRING(
      50
     ),
    allowNull: true,
   },

   ip_backup: {
    type:
     DataTypes.STRING(
      50
     ),
    allowNull: true,
   },

   cls_managerial: {
    type:
     DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
   },

   cls_meeting: {
    type:
     DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
   },

   cls_aktivitas_khusus:
   {
    type:
     DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
   },

   cls_officer_admin:
   {
    type:
     DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
   },

   cls_teknikal: {
    type:
     DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
   },

   cls_operator: {
    type:
     DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
   },

   cls_aplikasi_wms:
   {
    type:
     DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
   },

   cls_vms: {
    type:
     DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
   },

   cls_cctv_view: {
    type:
     DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
   },

   cls_station_delivery:
   {
    type:
     DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
   },

   cls_aplikasi_gathering:
   {
    type:
     DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
   },

   cls_oqc: {
    type:
     DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
   },

   created_at: {
    type:
     DataTypes.DATE,
    allowNull: false,
   },
   mac_address: DataTypes.STRING,
   operating_system: DataTypes.STRING,
   os_version: DataTypes.STRING,
   is_domain_join: DataTypes.BOOLEAN,
   antivirus_status: DataTypes.STRING,
  },
  {
   tableName: "assets",
   timestamps: false,
   freezeTableName: true,
  }
 );