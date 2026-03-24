#!/usr/bin/env node
/**
 * Starts the API on SMOKE_PORT (default 3099), runs HTTP checks, then stops the server.
 * Avoids conflicting with dev on port 3000.
 */
const { spawn } = require("child_process");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const PORT = process.env.SMOKE_PORT || "3099";
const BASE = `http://127.0.0.1:${PORT}`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForHealth(maxMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const r = await fetch(`${BASE}/health`);
      if (r.ok) return true;
    } catch {
      /* not up yet */
    }
    await sleep(400);
  }
  return false;
}

async function main() {
  const child = spawn(process.execPath, ["src/index.js"], {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, PORT },
    stdio: "pipe",
  });

  let stderr = "";
  child.stderr.on("data", (c) => {
    stderr += c.toString();
    process.stderr.write(c);
  });
  child.stdout.on("data", (c) => {
    process.stdout.write(c);
  });

  const cleanup = () => {
    try {
      child.kill("SIGTERM");
    } catch {
      /* ignore */
    }
  };
  process.on("SIGINT", () => {
    cleanup();
    process.exit(130);
  });

  const ready = await waitForHealth();
  if (!ready) {
    console.error("[smoke] server did not become ready in time");
    cleanup();
    process.exit(1);
  }

  let failed = false;
  const check = async (name, fn) => {
    try {
      await fn();
      console.log(`[smoke] OK  ${name}`);
    } catch (e) {
      console.error(`[smoke] FAIL ${name}: ${e.message}`);
      failed = true;
    }
  };

  await check("GET /health", async () => {
    const r = await fetch(`${BASE}/health`);
    if (!r.ok) throw new Error(`status ${r.status}`);
    const j = await r.json();
    if (j.status !== "ok") throw new Error("body.status not ok");
  });

  await check("GET /api/simulation/history", async () => {
    const r = await fetch(`${BASE}/api/simulation/history`);
    if (!r.ok) throw new Error(`status ${r.status}`);
    const j = await r.json();
    if (!Array.isArray(j.history)) throw new Error("missing history array");
  });

  await check("GET /api/simulation/notanid → 400", async () => {
    const r = await fetch(`${BASE}/api/simulation/notanid`);
    if (r.status !== 400) throw new Error(`expected 400, got ${r.status}`);
  });

  await check("GET /api/simulation/999999999 → 404", async () => {
    const r = await fetch(`${BASE}/api/simulation/999999999`);
    if (r.status !== 404) throw new Error(`expected 404, got ${r.status}`);
  });

  await check("POST /api/simulation no body → 400", async () => {
    const r = await fetch(`${BASE}/api/simulation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (r.status !== 400) throw new Error(`expected 400, got ${r.status}`);
  });

  await check("POST /api/simulation short decision → 400", async () => {
    const r = await fetch(`${BASE}/api/simulation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "hi" }),
    });
    if (r.status !== 400) throw new Error(`expected 400, got ${r.status}`);
  });

  const hasAwsCreds =
    Boolean(process.env.AWS_ACCESS_KEY_ID) ||
    Boolean(process.env.AWS_PROFILE) ||
    Boolean(process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI);

  if (hasAwsCreds) {
    await check("POST /api/simulation (Bedrock)", async () => {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 120_000);
      try {
        const r = await fetch(`${BASE}/api/simulation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision:
              "Should I take a one year sabbatical to learn guitar and travel?",
          }),
          signal: controller.signal,
        });
        if (r.status === 429) {
          const body = await r.json().catch(() => ({}));
          throw new Error(
            `429 — ${body.error || "Provider rate limit / quota exceeded."}`
          );
        }
        if (r.status === 502) {
          throw new Error(
            "502 — LLM parse failed, bad model id, or missing Bedrock model access"
          );
        }
        if (r.status !== 201) {
          throw new Error(`expected 201, got ${r.status}`);
        }
        const j = await r.json();
        if (!j.universeA?.length || !j.universeB?.length) {
          throw new Error("missing universeA / universeB");
        }
      } finally {
        clearTimeout(t);
      }
    });
  } else {
    console.log(
      "[smoke] SKIP POST /api/simulation — set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY (or AWS_PROFILE) and AWS_REGION"
    );
  }

  cleanup();
  await sleep(600);
  if (failed) {
    if (stderr) console.error("[smoke] server stderr (tail):\n", stderr.slice(-2000));
    process.exit(1);
  }
  console.log("[smoke] all checks passed");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
