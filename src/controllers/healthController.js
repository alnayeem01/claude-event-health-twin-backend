const { HealthRun } = require("../models");
const { computeHealth } = require("../lib/healthModel");
const { generateHealthInsight } = require("../services/bedrock");

function bedrockErrorResponse(res, err) {
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
        "Bedrock rate limit exceeded. Retry later or raise quotas in AWS.",
    });
  }
  if (status === 404 || err.name === "ValidationException") {
    return res.status(502).json({
      error:
        "Bedrock model or region invalid. Set BEDROCK_MODEL_ID and AWS_REGION; enable the model in the Bedrock console.",
    });
  }
  return res.status(502).json({
    error: "AI response failed or could not be parsed",
  });
}

async function createHealthSimulation(req, res) {
  const inputs = req.validatedLifestyle;
  const metrics = computeHealth(inputs);

  let insight;
  try {
    insight = await generateHealthInsight(inputs, metrics);
  } catch (err) {
    console.error("[health] AI failure", err);
    return bedrockErrorResponse(res, err);
  }

  let run;
  try {
    run = await HealthRun.create({
      inputs,
      metrics,
      insight,
    });
  } catch (err) {
    console.error("[health] save failed", err);
    return res.status(500).json({ error: "Failed to save health run" });
  }

  return res.status(201).json({
    id: run.id,
    createdAt: run.createdAt,
    inputs,
    metrics,
    insight,
  });
}

async function getHealthHistory(_req, res) {
  try {
    const rows = await HealthRun.findAll({
      order: [["createdAt", "DESC"]],
      limit: 10,
    });

    const history = rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      inputs: r.inputs,
      metrics: r.metrics,
      insight: r.insight,
    }));

    return res.json({ history });
  } catch (err) {
    console.error("[health] history failed", err);
    return res.status(500).json({ error: "Failed to load history" });
  }
}

async function getHealthRunById(req, res) {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid health run id" });
  }

  try {
    const run = await HealthRun.findByPk(id);
    if (!run) {
      return res.status(404).json({ error: "Health run not found" });
    }

    return res.json({
      id: run.id,
      createdAt: run.createdAt,
      inputs: run.inputs,
      metrics: run.metrics,
      insight: run.insight,
    });
  } catch (err) {
    console.error("[health] get by id failed", err);
    return res.status(500).json({ error: "Failed to load health run" });
  }
}

module.exports = {
  createHealthSimulation,
  getHealthHistory,
  getHealthRunById,
};
