const {
  BedrockRuntimeClient,
  ConverseCommand,
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

function extractConverseText(response) {
  const out = response.output;
  if (!out || typeof out !== "object") {
    throw new Error("Empty Bedrock Converse output");
  }
  if (!("message" in out) || !out.message?.content?.length) {
    throw new Error("Unexpected Converse output shape");
  }
  const texts = out.message.content
    .filter((block) => block && typeof block.text === "string")
    .map((block) => block.text);
  const joined = texts.join("\n").trim();
  if (!joined) {
    throw new Error("Empty Bedrock response text");
  }
  return joined;
}

async function callBedrockOnce(decisionText) {
  const modelId = getModelId();
  const region = getRegion();
  const client = new BedrockRuntimeClient({ region });

  const userText = buildTimelineUserPrompt(decisionText);

  const command = new ConverseCommand({
    modelId,
    system: [{ text: TIMELINE_SYSTEM_INSTRUCTION }],
    messages: [
      {
        role: "user",
        content: [{ text: userText }],
      },
    ],
    inferenceConfig: {
      maxTokens: 900,
    },
  });

  const response = await client.send(command);
  return extractConverseText(response);
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
