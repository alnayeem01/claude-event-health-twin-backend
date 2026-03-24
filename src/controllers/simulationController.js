const { Decision, Simulation } = require("../models");
const { generateSimulationTimelines } = require("../services/llm");

async function createSimulation(req, res) {
  const decisionText = req.validatedDecision;
  console.log("[simulation] incoming POST", {
    length: decisionText.length,
  });

  let decision;
  try {
    decision = await Decision.create({ decisionText });
  } catch (err) {
    console.error("[simulation] decision save failed", err);
    return res.status(500).json({ error: "Failed to save decision" });
  }

  console.log("[simulation] AI request start", { decisionId: decision.id });
  let universes;
  try {
    universes = await generateSimulationTimelines(decisionText);
  } catch (err) {
    console.error("[simulation] AI failure", err);
    const status = err.status;
    const awsHttp = err.$metadata?.httpStatusCode;
    const throttled =
      status === 429 ||
      awsHttp === 429 ||
      err.name === "ThrottlingException" ||
      err.name === "TooManyRequestsException";

    if (throttled) {
      return res.status(429).json({
        error:
          "Model provider rate limit exceeded. Retry later or adjust quota / billing (Gemini AI Studio or AWS Bedrock).",
      });
    }
    if (status === 404) {
      return res.status(502).json({
        error:
          "LLM model not found. Set GEMINI_MODEL (Gemini) or BEDROCK_MODEL_ID + AWS_REGION (Bedrock).",
      });
    }
    return res.status(502).json({
      error: "AI response failed or could not be parsed",
    });
  }
  console.log("[simulation] AI response received", { decisionId: decision.id });

  let simulation;
  try {
    simulation = await Simulation.create({
      decisionId: decision.id,
      universeA: universes.universeA,
      universeB: universes.universeB,
    });
  } catch (err) {
    console.error("[simulation] simulation save failed", err);
    return res.status(500).json({ error: "Failed to save simulation" });
  }

  console.log("[simulation] simulation saved", {
    simulationId: simulation.id,
    decisionId: decision.id,
  });

  return res.status(201).json({
    id: simulation.id,
    decisionId: decision.id,
    decision: decisionText,
    universeA: universes.universeA,
    universeB: universes.universeB,
    createdAt: simulation.createdAt,
  });
}

async function getHistory(_req, res) {
  try {
    const rows = await Simulation.findAll({
      include: [{ model: Decision, as: "decision", attributes: ["id", "decisionText"] }],
      order: [["createdAt", "DESC"]],
      limit: 10,
    });

    const payload = rows.map((s) => ({
      id: s.id,
      decisionId: s.decisionId,
      decision: s.decision?.decisionText ?? null,
      universeA: s.universeA,
      universeB: s.universeB,
      createdAt: s.createdAt,
    }));

    return res.json({ history: payload });
  } catch (err) {
    console.error("[simulation] history failed", err);
    return res.status(500).json({ error: "Failed to load history" });
  }
}

async function getSimulationById(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid simulation id" });
  }

  try {
    const simulation = await Simulation.findByPk(id, {
      include: [{ model: Decision, as: "decision", attributes: ["id", "decisionText"] }],
    });

    if (!simulation) {
      return res.status(404).json({ error: "Simulation not found" });
    }

    return res.json({
      id: simulation.id,
      decisionId: simulation.decisionId,
      decision: simulation.decision?.decisionText ?? null,
      universeA: simulation.universeA,
      universeB: simulation.universeB,
      createdAt: simulation.createdAt,
    });
  } catch (err) {
    console.error("[simulation] get by id failed", err);
    return res.status(500).json({ error: "Failed to load simulation" });
  }
}

module.exports = {
  createSimulation,
  getHistory,
  getSimulationById,
};
