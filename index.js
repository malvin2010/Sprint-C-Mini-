// ╔═══════════════════════════════════════════════╗
// ║          MALVIN C SPRINT — WhatsApp Bot        ║
// ║            Made by Handsome Tech              ║
// ╚═══════════════════════════════════════════════╝

const express = require("express");
const path = require("path");
const { startWhatsApp } = require("./lib/whatsapp");
const { startTelegramBot } = require("./lib/telegram");
const { router: pairRouter } = require("./lib/pairApi");

const app = express();
app.use(express.json());

// ── Serve the pairing website ──
app.use(express.static(path.join(__dirname, "public")));

// ── Pairing API routes ──
app.use("/api/pair", pairRouter);

// ── Telegram webhook (Vercel) ──
app.post("/api/telegram", async (req, res) => {
  const { telegramBot } = require("./lib/telegram");
  if (telegramBot) telegramBot.processUpdate(req.body);
  res.sendStatus(200);
});

// ── Status endpoint ──
app.get("/api/status", (req, res) => {
  const { getWhatsAppStatus } = require("./lib/whatsapp");
  res.json({
    whatsapp: getWhatsAppStatus(),
    telegram: "connected",
    bot: "Malvin C Sprint",
    author: "Handsome Tech",
  });
});

// ── Catch-all → serve the pairing site ──
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;

async function main() {
  try {
    console.log("╔══════════════════════════════════════╗");
    console.log("║       MALVIN C SPRINT STARTING       ║");
    console.log("║         Made by Handsome Tech        ║");
    console.log("╚══════════════════════════════════════╝");

    await startTelegramBot();
    console.log("✅ Telegram bot started");

    await startWhatsApp();
    console.log("✅ WhatsApp engine started");

    app.listen(PORT, () => {
      console.log(`✅ Server running → http://localhost:${PORT}`);
      console.log(`🌐 Pairing site → http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Fatal error:", err);
    process.exit(1);
  }
}

main();

module.exports = app;
