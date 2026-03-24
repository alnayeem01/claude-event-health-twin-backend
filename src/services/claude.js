const Anthropic = require("@anthropic-ai/sdk");

const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 900;
const REQUEST_TIMEOUT_MS = 45_000;

function stripJsonFences(text) {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(trimmed);
  return fence ? fence[1].trim() : trimmed;
}

function extractTextContent(message) {
  if (!message?.content?.length) return "";
  return message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

function isYearStoryArray(arr) {
  if (!Array.isArray(arr) || arr.length !== 5) return false;
  return arr.every(
    (item) =>
      item &&
      typeof item === "object" &&
      typeof item.year === "number" &&
      typeof item.story === "string" &&
      item.story.length > 0
  );
}

function validateUniversePayload(parsed) {
  if (!parsed || typeof parsed !== "object") return false;
  const { universeA, universeB } = parsed;
  return isYearStoryArray(universeA) && isYearStoryArray(universeB);
}

function buildPrompt(decisionText) {
  const years = [2026, 2027, 2028, 2029, 2030];
  return `The user is considering this decision:

"${decisionText.replace(/"/g, '\\"')}"

Simulate two realistic futures. Each universe must have exactly 5 timeline entries for these years in order: ${years.join(", ")}.

Universe A: the user takes this decision.
Universe B: the user does not take this decision.

For each year, write a short narrative (2-4 sentences) covering career, relationships, personal growth, possible regrets, and happiness. Be realistic, not fantasy.

Respond with ONLY valid JSON, no markdown, no commentary. Shape:
{"universeA":[{"year":2026,"story":"..."},...],"universeB":[{"year":2026,"story":"..."},...]}

Each array must have exactly 5 objects with integer year and string story.`;
}

async function callClaudeOnce(decisionText) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const userPrompt = buildPrompt(decisionText);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const message = await client.messages.create(
      {
        model,
        max_tokens: MAX_TOKENS,
        system:
          "You output only minified JSON matching the user's schema. Never diagnose or give medical advice. You simulate plausible life trajectories for narrative purposes only.",
        messages: [{ role: "user", content: userPrompt }],
      },
      { signal: controller.signal }
    );
    return extractTextContent(message);
  } finally {
    clearTimeout(timeout);
  }
}

function parseUniverseJson(rawText) {
  const cleaned = stripJsonFences(rawText);
  const parsed = JSON.parse(cleaned);
  if (!validateUniversePayload(parsed)) {
    throw new Error("Invalid universe payload shape");
  }
  return {
    universeA: parsed.universeA,
    universeB: parsed.universeB,
  };
}

/**
 * @param {string} decisionText
 * @returns {Promise<{ universeA: object[], universeB: object[] }>}
 */
async function generateSimulationTimelines(decisionText) {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await callClaudeOnce(decisionText);
      return parseUniverseJson(raw);
    } catch (err) {
      lastErr = err;
      console.error("[claude] parse or API failure", {
        attempt: attempt + 1,
        message: err.message,
      });
    }
  }
  throw lastErr;
}

module.exports = {
  generateSimulationTimelines,
  parseUniverseJson,
  validateUniversePayload,
};
