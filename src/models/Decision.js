const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Decision = sequelize.define(
  "Decision",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    decisionText: {
      type: DataTypes.STRING(300),
      allowNull: false,
      field: "decision_text",
    },
  },
  {
    tableName: "decisions",
    timestamps: true,
    updatedAt: "updated_at",
    createdAt: "created_at",
  }
);

module.exports = { Decision };
