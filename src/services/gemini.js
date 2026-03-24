const { GoogleGenerativeAI } = require("@google/generative-ai");
const {
  TIMELINE_SYSTEM_INSTRUCTION,
  buildTimelineUserPrompt,
  parseUniverseResponse,
  validateUniversePayload,
} = require("../lib/universeTimeline");

/** @see https://ai.google.dev/gemini-api/docs/models */
const DEFAULT_MODEL = "gemini-2.0-flash";
const AUTO_FALLBACK_MODELS = ["gemini-2.0-flash-001"];
const MAX_OUTPUT_TOKENS = 900;
const REQUEST_TIMEOUT_MS = 45_000;

async function callGeminiOnce(decisionText, modelName) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      responseMimeType: "application/json",
    },
    systemInstruction: TIMELINE_SYSTEM_INSTRUCTION,
  });

  const userPrompt = buildTimelineUserPrompt(decisionText);
  const result = await model.generateContent(userPrompt, {
    timeout: REQUEST_TIMEOUT_MS,
  });

  const text = result.response.text();
  if (!text) {
    throw new Error("Empty model response");
  }
  return text;
}

/**
 * Calls Gemini; if `GEMINI_MODEL` is unset and the API returns 404 (unknown model id),
 * tries fallback model ids (Google renames / retires short ids like `gemini-1.5-flash`).
 */
async function generateRawWithModelFallback(decisionText) {
  const explicit = process.env.GEMINI_MODEL?.trim();
  const chain = explicit
    ? [explicit]
    : [DEFAULT_MODEL, ...AUTO_FALLBACK_MODELS];

  let lastErr;
  for (let i = 0; i < chain.length; i += 1) {
    const name = chain[i];
    try {
      return await callGeminiOnce(decisionText, name);
    } catch (err) {
      lastErr = err;
      const is404 = err.status === 404;
      if (!explicit && is404 && i < chain.length - 1) {
        const next = chain[i + 1];
        console.warn(
          `[gemini] model "${name}" not found (404), trying "${next}"`
        );
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

/**
 * @param {string} decisionText
 * @returns {Promise<{ universeA: object[], universeB: object[] }>}
 */
async function generateSimulationTimelines(decisionText) {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await generateRawWithModelFallback(decisionText);
      return parseUniverseResponse(raw);
    } catch (err) {
      lastErr = err;
      console.error("[gemini] parse or API failure", {
        attempt: attempt + 1,
        message: err.message,
      });
    }
  }
  throw lastErr;
}

module.exports = {
  generateSimulationTimelines,
  parseUniverseJson: parseUniverseResponse,
  validateUniversePayload,
};
