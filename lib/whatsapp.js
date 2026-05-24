// lib/whatsapp.js — WhatsApp Multi-Device Connection
// Malvin C Sprint | Made by Handsome Tech

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  isJidBroadcast,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const path = require("path");
const fs = require("fs");
const { sendToTelegram, getPairingCode } = require("./telegram");
const { setLatestQR, clearQR } = require("./pairApi");
const { handleMessage } = require("./handler");

const SESSION_DIR = path.join(process.cwd(), "session");
let waSocket = null;
let connectionStatus = "disconnected";
let reconnectAttempts = 0;
const MAX_RECONNECT = 5;

function getWhatsAppStatus() {
  return {
    status: connectionStatus,
    reconnectAttempts,
    sessionExists: fs.existsSync(SESSION_DIR),
  };
}

async function startWhatsApp() {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const logger = pino({ level: "silent" });

  waSocket = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: false,
    getMessage: async () => ({ conversation: "" }),
    shouldIgnoreJid: (jid) => isJidBroadcast(jid),
    browser: ["Malvin C Sprint", "Chrome", "1.0.0"],
    syncFullHistory: false,
  });

  // ── Connection Updates ──
  waSocket.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      setLatestQR(qr);
      connectionStatus = "waiting_for_scan";
      console.log("📲 QR generated — sending to Telegram admin & web...");
      const QRCode = require("qrcode");
      const qrImage = await QRCode.toBuffer(qr, { type: "png", width: 512 });
      await sendToTelegram(
        null,
        "📲 *Malvin C Sprint — Scan QR*\n\nScan this QR code in WhatsApp → Linked Devices → Link a Device\n\n_Made by Handsome Tech_",
        qrImage
      );
    }

    if (connection === "open") {
      connectionStatus = "connected";
      reconnectAttempts = 0;
      clearQR();
      const phone = waSocket.user?.id?.split(":")[0];
      console.log(`✅ WhatsApp connected as ${phone}`);
      await sendToTelegram(
        null,
        `✅ *Malvin C Sprint Connected!*\n\n📱 Number: +${phone}\n🤖 Bot: Malvin C Sprint\n👨‍💻 Made by: Handsome Tech\n\nBot is now live on WhatsApp!`
      );
    }

    if (connection === "close") {
      connectionStatus = "disconnected";
      const code = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;

      console.log(`⚠️ Connection closed. Code: ${code}`);

      if (shouldReconnect && reconnectAttempts < MAX_RECONNECT) {
        reconnectAttempts++;
        console.log(`🔄 Reconnecting... attempt ${reconnectAttempts}/${MAX_RECONNECT}`);
        setTimeout(() => startWhatsApp(), 5000 * reconnectAttempts);
      } else if (code === DisconnectReason.loggedOut) {
        console.log("🚪 Logged out — clearing session...");
        fs.rmSync(SESSION_DIR, { recursive: true, force: true });
        await sendToTelegram(
          null,
          "⚠️ *Malvin C Sprint logged out!*\n\nSession cleared. Send /pair to re-connect."
        );
      } else {
        console.log("❌ Max reconnect attempts reached");
        await sendToTelegram(
          null,
          "❌ *Malvin C Sprint disconnected*\n\nMax reconnect attempts reached. Please restart the bot."
        );
      }
    }
  });

  // ── Save Credentials ──
  waSocket.ev.on("creds.update", saveCreds);

  // ── Messages ──
  waSocket.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      await handleMessage(waSocket, msg);
    }
  });

  return waSocket;
}

function getSocket() {
  return waSocket;
}

module.exports = { startWhatsApp, getWhatsAppStatus, getSocket };
