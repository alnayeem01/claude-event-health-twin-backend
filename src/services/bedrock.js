const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require("@aws-sdk/client-bedrock-runtime");
const {
  TIMELINE_SYSTEM_INSTRUCTION,
  buildTimelineUserPrompt,
  parseUniverseResponse,
} = require("../lib/universeTimeline");

const DEFAULT_MODEL_ID =
  "anthropic.claude-3-5-sonnet-20241022-v2:0";

function getModelId() {
  return (process.env.BEDROCK_MODEL_ID || DEFAULT_MODEL_ID).trim();
}

function getRegion() {
  return (
    process.env.AWS_REGION ||
    process.env.AWS_DEFAULT_REGION ||
    "us-east-1"
  ).trim();
}

async function callBedrockOnce(decisionText) {
  const modelId = getModelId();
  const region = getRegion();
  const client = new BedrockRuntimeClient({ region });

  const userText = buildTimelineUserPrompt(decisionText);
  const payload = JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 900,
    system: TIMELINE_SYSTEM_INSTRUCTION,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: userText }],
      },
    ],
  });

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: new TextEncoder().encode(payload),
  });

  const response = await client.send(command);
  const raw = new TextDecoder().decode(response.body);
  const out = JSON.parse(raw);
  const textBlock = out.content?.find((c) => c.type === "text");
  if (!textBlock?.text) {
    throw new Error("Empty Bedrock response text");
  }
  return textBlock.text;
}

/**
 * @param {string} decisionText
 * @returns {Promise<{ universeA: object[], universeB: object[] }>}
 */
async function generateSimulationTimelines(decisionText) {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await callBedrockOnce(decisionText);
      return parseUniverseResponse(raw);
    } catch (err) {
      lastErr = err;
      console.error("[bedrock] parse or API failure", {
        attempt: attempt + 1,
        message: err.message,
        name: err.name,
      });
    }
  }
  throw lastErr;
}

module.exports = {
  generateSimulationTimelines,
};
