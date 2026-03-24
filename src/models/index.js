const { Decision } = require("./Decision");
const { Simulation } = require("./Simulation");

Decision.hasMany(Simulation, {
  foreignKey: "decisionId",
  as: "simulations",
  onDelete: "CASCADE",
});
Simulation.belongsTo(Decision, { foreignKey: "decisionId", as: "decision" });

module.exports = { Decision, Simulation };
