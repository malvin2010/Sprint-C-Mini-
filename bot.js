// bot.js — Run this on Railway or Render (NOT Vercel)
// Malvin C Sprint | Made by Handsome Tech

const express = require("express");
const path = require("path");
const { startWhatsApp } = require("./lib/whatsapp");
const { startTelegramBot } = require("./lib/telegram");
const { router: pairRouter } = require("./lib/pairApi");

const app = express();
app.use(express.json());

app.use("/api/pair", pairRouter);

app.get("/api/status", (req, res) => {
  const { getWhatsAppStatus } = require("./lib/whatsapp");
  res.json({
    whatsapp: getWhatsAppStatus(),
    bot: "Malvin C Sprint",
    author: "Handsome Tech",
  });
});

app.get("/", (req, res) => {
  res.json({ status: "online", bot: "Malvin C Sprint", author: "Handsome Tech" });
});

const PORT = process.env.PORT || 4000;

async function main() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║       MALVIN C SPRINT STARTING       ║");
  console.log("║         Made by Handsome Tech        ║");
  console.log("╚══════════════════════════════════════╝");

  await startTelegramBot();
  console.log("✅ Telegram bot started");

  await startWhatsApp();
  console.log("✅ WhatsApp engine started");

  app.listen(PORT, () => {
    console.log(`✅ Bot server running on port ${PORT}`);
  });
}

main().catch(console.error);
                                        
