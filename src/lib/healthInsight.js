const { stripJsonFences } = require("./universeTimeline");

const HEALTH_INSIGHT_SYSTEM_INSTRUCTION =
  "You output only valid JSON matching the user's schema. Do not diagnose medical conditions or give individualized medical advice. Provide general wellness education and hypothetical simulation language only.";

function buildHealthInsightUserPrompt(inputs, metrics) {
  return `The user submitted a lifestyle profile for a hypothetical "digital twin" wellness simulation (not a clinical assessment).

Inputs (JSON): ${JSON.stringify(inputs)}

Computed model scores (JSON): ${JSON.stringify(metrics)}

Write five text fields that match the tone of a supportive wellness coach. Reference their numbers where natural. Do not claim certainty or medical outcomes.

Respond with ONLY valid JSON (no markdown). Shape:
{"observation":"string","risk":"string","recommendation":"string","explainWhy":"string","howToImprove":"string"}

Each string must be non-empty and 1-1200 characters. Use plain sentences.`;
}

function isNonEmptyString(s, maxLen = 1200) {
  return typeof s === "string" && s.trim().length > 0 && s.length <= maxLen;
}

function validateInsightPayload(parsed) {
  if (!parsed || typeof parsed !== "object") return false;
  const keys = [
    "observation",
    "risk",
    "recommendation",
    "explainWhy",
    "howToImprove",
  ];
  return keys.every((k) => isNonEmptyString(parsed[k]));
}

function parseHealthInsightResponse(rawText) {
  const cleaned = stripJsonFences(rawText);
  const parsed = JSON.parse(cleaned);
  if (!validateInsightPayload(parsed)) {
    throw new Error("Invalid health insight payload shape");
  }
  return {
    observation: parsed.observation.trim(),
    risk: parsed.risk.trim(),
    recommendation: parsed.recommendation.trim(),
    explainWhy: parsed.explainWhy.trim(),
    howToImprove: parsed.howToImprove.trim(),
  };
}

module.exports = {
  HEALTH_INSIGHT_SYSTEM_INSTRUCTION,
  buildHealthInsightUserPrompt,
  parseHealthInsightResponse,
  validateInsightPayload,
};
