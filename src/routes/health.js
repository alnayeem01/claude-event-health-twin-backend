const express = require("express");
const { validateHealthBody } = require("../middleware/validateHealthBody");
const {
  createHealthSimulation,
  getHealthHistory,
  getHealthRunById,
} = require("../controllers/healthController");

const router = express.Router();

router.post("/simulate", validateHealthBody, createHealthSimulation);
router.get("/history", getHealthHistory);
router.get("/:id", getHealthRunById);

module.exports = { healthRouter: router };
