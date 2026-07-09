import { DataTypes } from "sequelize";

export default (sequelize) =>
 sequelize.define(
  "PhishingMonitoringLog",
  {
   log_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
   },
   campaign_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
   },
   image_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
   },
   ip_address: {
    type: DataTypes.STRING(64),
    allowNull: false,
   },
   user_agent: {
    type: DataTypes.STRING(1000),
    allowNull: true,
   },
   asset_id: {
    type: DataTypes.UUID,
    allowNull: true,
   },
   asset_code: {
    type: DataTypes.STRING(50),
    allowNull: true,
   },
   owner_name: {
    type: DataTypes.STRING(200),
    allowNull: true,
   },
   nik: {
    type: DataTypes.STRING(30),
    allowNull: true,
   },
   department: {
    type: DataTypes.STRING(200),
    allowNull: true,
   },
   division: {
    type: DataTypes.STRING(200),
    allowNull: true,
   },
   hostname: {
    type: DataTypes.STRING(100),
    allowNull: true,
   },
   match_status: {
    type: DataTypes.STRING(20),
    allowNull: false,
   },
   clicked_at: {
    type: DataTypes.DATE,
    allowNull: false,
   },
  },
  {
   tableName: "phishing_monitoring_logs",
   timestamps: false,
   freezeTableName: true,
  }
 );
