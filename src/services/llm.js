let cachedFn;

function resolveGenerator() {
  if (cachedFn) {
    return cachedFn;
  }
  const p = (process.env.LLM_PROVIDER || "gemini").toLowerCase();
  if (p === "bedrock") {
    cachedFn = require("./bedrock").generateSimulationTimelines;
  } else if (p === "gemini") {
    cachedFn = require("./gemini").generateSimulationTimelines;
  } else {
    throw new Error(
      `Unknown LLM_PROVIDER="${process.env.LLM_PROVIDER}". Use gemini or bedrock.`
    );
  }
  return cachedFn;
}

/**
 * @param {string} decisionText
 * @returns {Promise<{ universeA: object[], universeB: object[] }>}
 */
async function generateSimulationTimelines(decisionText) {
  return resolveGenerator()(decisionText);
}

module.exports = { generateSimulationTimelines };
