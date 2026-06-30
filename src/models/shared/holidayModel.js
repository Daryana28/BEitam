import { DataTypes } from "sequelize";

export default (sequelize) =>
  sequelize.define(
    "Holiday",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      holiday_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      holiday_type: {
        type: DataTypes.ENUM('NATIONAL_HOLIDAY', 'COLLECTIVE_LEAVE', 'OTHER'),
        defaultValue: 'NATIONAL_HOLIDAY',
      },
    },
    {
      tableName: "holidays",
      timestamps: true,
      freezeTableName: true,
    }
  );
