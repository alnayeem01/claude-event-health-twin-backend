const TIMELINE_SYSTEM_INSTRUCTION =
  "You output only valid JSON matching the user's schema. Never diagnose or give medical advice. You simulate plausible life trajectories for narrative purposes only.";

function stripJsonFences(text) {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(trimmed);
  return fence ? fence[1].trim() : trimmed;
}

function isValidYear(y) {
  const n =
    typeof y === "number"
      ? y
      : typeof y === "string"
        ? parseInt(y, 10)
        : NaN;
  return Number.isInteger(n) && n >= 1900 && n <= 2100;
}

function isYearStoryArray(arr) {
  if (!Array.isArray(arr) || arr.length !== 5) return false;
  return arr.every(
    (item) =>
      item &&
      typeof item === "object" &&
      isValidYear(item.year) &&
      typeof item.story === "string" &&
      item.story.length > 0
  );
}

function validateUniversePayload(parsed) {
  if (!parsed || typeof parsed !== "object") return false;
  const { universeA, universeB } = parsed;
  return isYearStoryArray(universeA) && isYearStoryArray(universeB);
}

function buildTimelineUserPrompt(decisionText) {
  const years = [2026, 2027, 2028, 2029, 2030];
  return `The user is considering this decision:

"${decisionText.replace(/"/g, '\\"')}"

Simulate two realistic futures. Each universe must have exactly 5 timeline entries for these years in order: ${years.join(", ")}.

Universe A: the user takes this decision.
Universe B: the user does not take this decision.

For each year, write a short narrative (2-4 sentences) covering career, relationships, personal growth, possible regrets, and happiness. Be realistic, not fantasy.

Respond with ONLY valid JSON (no markdown). Shape:
{"universeA":[{"year":2026,"story":"..."},...],"universeB":[{"year":2026,"story":"..."},...]}

Each array must have exactly 5 objects. Use integer years and string stories.`;
}

function parseUniverseResponse(rawText) {
  const cleaned = stripJsonFences(rawText);
  const parsed = JSON.parse(cleaned);
  if (!validateUniversePayload(parsed)) {
    throw new Error("Invalid universe payload shape");
  }
  return {
    universeA: parsed.universeA.map((e) => ({
      year: Number(e.year),
      story: e.story,
    })),
    universeB: parsed.universeB.map((e) => ({
      year: Number(e.year),
      story: e.story,
    })),
  };
}

module.exports = {
  TIMELINE_SYSTEM_INSTRUCTION,
  buildTimelineUserPrompt,
  parseUniverseResponse,
  parseUniverseJson: parseUniverseResponse,
  validateUniversePayload,
  stripJsonFences,
};
