const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const HealthRun = sequelize.define(
  "HealthRun",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    inputs: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    metrics: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    insight: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    tableName: "health_runs",
    timestamps: true,
    updatedAt: false,
  }
);

module.exports = { HealthRun };
