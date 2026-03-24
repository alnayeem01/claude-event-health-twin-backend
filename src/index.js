require("dotenv").config();

const cors = require("cors");
const express = require("express");
const { sequelize } = require("./config/database");
require("./models");
const { simulationRouter } = require("./routes/simulation");

const app = express();
const PORT = process.env.PORT || 3000;

function corsOptions() {
  const raw = process.env.FRONTEND_ORIGIN;
  if (!raw || raw.trim() === "") {
    return { origin: true };
  }
  const allowed = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return {
    origin(origin, callback) {
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  };
}

app.use(cors(corsOptions()));
app.use(express.json({ limit: "32kb" }));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/simulation", simulationRouter);

async function start() {
  try {
    await sequelize.authenticate();
    console.log("[db] connection established");
  } catch (err) {
    console.error("[db] unable to connect", err);
    process.exit(1);
  }

  const syncOptions =
    process.env.NODE_ENV === "production" ? {} : { alter: true };
  await sequelize.sync(syncOptions);
  console.log("[db] models synced");

  const server = app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `[server] Port ${PORT} is in use. Stop the other process (e.g. lsof -i :${PORT}) or set PORT=3001 in .env`
      );
    } else {
      console.error("[server] listen error", err);
    }
    process.exit(1);
  });
}

start();
