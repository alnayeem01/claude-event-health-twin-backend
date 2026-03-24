const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Simulation = sequelize.define(
  "Simulation",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    decisionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "decision_id",
      references: {
        model: "decisions",
        key: "id",
      },
    },
    universeA: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: "universe_a",
    },
    universeB: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: "universe_b",
    },
  },
  {
    tableName: "simulations",
    timestamps: true,
    updatedAt: false,
  }
);

module.exports = { Simulation };
