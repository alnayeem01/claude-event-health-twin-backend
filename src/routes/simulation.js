const express = require("express");
const {
  createSimulation,
  getHistory,
  getSimulationById,
} = require("../controllers/simulationController");
const { validateDecisionBody } = require("../middleware/validateDecision");

const router = express.Router();

router.post("/", validateDecisionBody, createSimulation);
router.get("/history", getHistory);
router.get("/:id", getSimulationById);

module.exports = { simulationRouter: router };
