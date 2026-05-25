// ╔═══════════════════════════════════════════════╗
// ║          MALVIN C SPRINT — WhatsApp Bot        ║
// ║            Made by Handsome Tech              ║
// ╚═══════════════════════════════════════════════╝

const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

// Serve the pairing website
app.use(express.static(path.join(__dirname, "public")));

// Telegram webhook (receives updates from Telegram)
app.post("/api/telegram", async (req, res) => {
  try {
    const { telegramBot } = require("./lib/telegram");
    if (telegramBot) telegramBot.processUpdate(req.body);
  } catch (e) {}
  res.sendStatus(200);
});

// Status endpoint
app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    bot: "Malvin C Sprint",
    author: "Handsome Tech",
    note: "Bot engine runs on Railway/Render — this is the web UI only",
  });
});

// Pairing API — proxies to bot server
app.post("/api/pair/code", async (req, res) => {
  const BOT_SERVER = process.env.BOT_SERVER_URL;
  if (!BOT_SERVER) {
    return res.status(503).json({ error: "Bot server URL not configured. Set BOT_SERVER_URL env var." });
  }
  try {
    const axios = require("axios");
    const response = await axios.post(`${BOT_SERVER}/api/pair/code`, req.body, { timeout: 15000 });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Could not reach bot server." });
  }
});

app.get("/api/pair/qr", async (req, res) => {
  const BOT_SERVER = process.env.BOT_SERVER_URL;
  if (!BOT_SERVER) {
    return res.status(503).json({ error: "Bot server URL not configured. Set BOT_SERVER_URL env var." });
  }
  try {
    const axios = require("axios");
    const response = await axios.get(`${BOT_SERVER}/api/pair/qr`, { timeout: 15000 });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Could not reach bot server." });
  }
});

// Catch-all
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Malvin C Sprint web UI running on port ${PORT}`);
});

module.exports = app;
