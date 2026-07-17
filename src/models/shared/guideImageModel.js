import { DataTypes } from "sequelize";

export default (sequelize) =>
  sequelize.define(
    "GuideImage",
    {
      guide_image_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      guide_key: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
      },
      label: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      file_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      file_path: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      file_url: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      file_ext: {
        type: DataTypes.STRING(20),
      },
      file_size: {
        type: DataTypes.BIGINT,
      },
      uploaded_by: {
        type: DataTypes.BIGINT,
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
      tableName: "guide_images",
      timestamps: false,
    }
  );
