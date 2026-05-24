// lib/telegram.js — Telegram Bot for WhatsApp Pairing
// Malvin C Sprint | Made by Handsome Tech

const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8232185847:AAGiXnd-zY7407moR3-oUpu1i04n-3r0pgA";
const ADMIN_IDS_RAW = process.env.ADMIN_IDS || "";
const SESSION_DIR = path.join(process.cwd(), "session");

let telegramBot = null;
let adminChatIds = new Set();
let pendingPairPhone = null;

const ADMINS_FILE = path.join(process.cwd(), ".admins.json");

function loadAdmins() {
  if (ADMIN_IDS_RAW) {
    ADMIN_IDS_RAW.split(",").forEach((id) => adminChatIds.add(id.trim()));
  }
  if (fs.existsSync(ADMINS_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(ADMINS_FILE, "utf8"));
      saved.forEach((id) => adminChatIds.add(String(id)));
    } catch (_) {}
  }
}

function saveAdmins() {
  fs.writeFileSync(ADMINS_FILE, JSON.stringify([...adminChatIds]), "utf8");
}

async function startTelegramBot() {
  loadAdmins();
  const isVercel = process.env.VERCEL === "1";

  telegramBot = new TelegramBot(TOKEN, { polling: !isVercel });

  if (isVercel && process.env.VERCEL_URL) {
    const webhookUrl = `https://${process.env.VERCEL_URL}/api/telegram`;
    await telegramBot.setWebHook(webhookUrl);
    console.log(`📡 Telegram webhook set: ${webhookUrl}`);
  }

  setupCommands();
  console.log("🤖 Telegram bot initialized: Malvin C Sprint");
  return telegramBot;
}

function setupCommands() {
  telegramBot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const name = msg.from.first_name || "there";
    await telegramBot.sendMessage(chatId,
      `👋 *Hello ${name}!*\n\n` +
      `🤖 I'm *Malvin C Sprint* — a WhatsApp Multi-Device Bot\n` +
      `👨‍💻 Made by *Handsome Tech*\n\n` +
      `*Commands:*\n` +
      `▸ /pair — Connect WhatsApp\n` +
      `▸ /status — Bot status\n` +
      `▸ /logout — Disconnect WhatsApp\n` +
      `▸ /restart — Restart connection\n` +
      `▸ /addadmin — Add yourself as admin\n` +
      `▸ /help — Show all commands\n\n` +
      `_Send /addadmin to register as admin first!_`,
      { parse_mode: "Markdown" }
    );
  });

  telegramBot.onText(/\/addadmin/, async (msg) => {
    const chatId = String(msg.chat.id);
    adminChatIds.add(chatId);
    saveAdmins();
    await telegramBot.sendMessage(msg.chat.id,
      `✅ *You are now an admin!*\n\nChat ID: \`${chatId}\`\n\nYou can now use all bot commands.`,
      { parse_mode: "Markdown" }
    );
  });

  telegramBot.onText(/\/pair(?:\s+(\+?\d+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!isAdmin(chatId)) return telegramBot.sendMessage(chatId, "❌ Not authorized. Send /addadmin first.");

    const phone = match[1];

    if (!phone) {
      await telegramBot.sendMessage(chatId,
        `📲 *QR Code Pairing*\n\nStarting WhatsApp connection...\n\nYou'll receive a QR code to scan in WhatsApp.\n\n_Or use: /pair +2547XXXXXXXX for pairing code_`,
        { parse_mode: "Markdown" }
      );
      const { startWhatsApp } = require("./whatsapp");
      await startWhatsApp();
    } else {
      pendingPairPhone = phone.replace(/\D/g, "");
      await telegramBot.sendMessage(chatId,
        `📱 *Pairing Code Method*\n\nPhone: \`${phone}\`\n\nGenerating 8-digit pairing code...\n\nOpen WhatsApp → Linked Devices → Link with Phone Number`,
        { parse_mode: "Markdown" }
      );

      try {
        const { startWhatsApp, getSocket } = require("./whatsapp");
        await startWhatsApp();
        await new Promise((r) => setTimeout(r, 3000));
        const sock = getSocket();
        if (sock) {
          const code = await sock.requestPairingCode(pendingPairPhone);
          const formatted = code.match(/.{1,4}/g).join("-");
          await telegramBot.sendMessage(chatId,
            `🔑 *Your Pairing Code:*\n\n\`${formatted}\`\n\n⏱ Enter this in WhatsApp within 60 seconds.\n\nWhatsApp → Linked Devices → Link with Phone Number → Enter code`,
            { parse_mode: "Markdown" }
          );
        }
      } catch (err) {
        await telegramBot.sendMessage(chatId,
          `❌ Error generating pairing code:\n\`${err.message}\``,
          { parse_mode: "Markdown" }
        );
      }
    }
  });

  telegramBot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    if (!isAdmin(chatId)) return;
    const { getWhatsAppStatus } = require("./whatsapp");
    const waStatus = getWhatsAppStatus();
    const emoji = waStatus.status === "connected" ? "🟢" : waStatus.status === "waiting_for_scan" ? "🟡" : "🔴";
    await telegramBot.sendMessage(chatId,
      `📊 *Malvin C Sprint Status*\n\n` +
      `${emoji} WhatsApp: \`${waStatus.status}\`\n` +
      `📁 Session: \`${waStatus.sessionExists ? "saved" : "none"}\`\n` +
      `🔄 Reconnects: \`${waStatus.reconnectAttempts}\`\n` +
      `🤖 Bot: \`Malvin C Sprint\`\n` +
      `👨‍💻 By: \`Handsome Tech\``,
      { parse_mode: "Markdown" }
    );
  });

  telegramBot.onText(/\/logout/, async (msg) => {
    const chatId = msg.chat.id;
    if (!isAdmin(chatId)) return;
    const { getSocket } = require("./whatsapp");
    const sock = getSocket();
    if (sock) await sock.logout();
    if (fs.existsSync(SESSION_DIR)) fs.rmSync(SESSION_DIR, { recursive: true, force: true });
    await telegramBot.sendMessage(chatId, "✅ WhatsApp logged out and session cleared.\n\nSend /pair to reconnect.");
  });

  telegramBot.onText(/\/restart/, async (msg) => {
    const chatId = msg.chat.id;
    if (!isAdmin(chatId)) return;
    await telegramBot.sendMessage(chatId, "🔄 Restarting WhatsApp connection...");
    const { startWhatsApp } = require("./whatsapp");
    await startWhatsApp();
  });

  telegramBot.onText(/\/help/, async (msg) => {
    await telegramBot.sendMessage(msg.chat.id,
      `📖 *Malvin C Sprint — Commands*\n\n` +
      `*Pairing:*\n` +
      `▸ \`/pair\` — QR code pairing\n` +
      `▸ \`/pair +254700000000\` — Phone number pairing\n\n` +
      `*Management:*\n` +
      `▸ \`/status\` — Connection status\n` +
      `▸ \`/logout\` — Disconnect & clear session\n` +
      `▸ \`/restart\` — Reconnect WhatsApp\n\n` +
      `*Admin:*\n` +
      `▸ \`/addadmin\` — Register as admin\n\n` +
      `_Made by Handsome Tech_ 🚀`,
      { parse_mode: "Markdown" }
    );
  });
}

function isAdmin(chatId) {
  if (adminChatIds.size === 0) return true;
  return adminChatIds.has(String(chatId));
}

async function sendToTelegram(chatId, message, imageBuffer = null) {
  if (!telegramBot) return;
  const targets = chatId ? [String(chatId)] : adminChatIds.size > 0 ? [...adminChatIds] : [];
  if (targets.length === 0) { console.log("📨 No admin IDs set. Message:", message); return; }
  for (const id of targets) {
    try {
      if (imageBuffer) {
        await telegramBot.sendPhoto(id, imageBuffer, { caption: message, parse_mode: "Markdown" });
      } else {
        await telegramBot.sendMessage(id, message, { parse_mode: "Markdown" });
      }
    } catch (err) {
      console.error(`Failed to send to Telegram ${id}:`, err.message);
    }
  }
}

function getPairingCode() { return pendingPairPhone; }

module.exports = { startTelegramBot, sendToTelegram, getPairingCode, telegramBot };
