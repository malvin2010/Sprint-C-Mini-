// lib/handler.js — WhatsApp Message Handler
// Malvin C Sprint | Made by Handsome Tech

const { getContentType } = require("@whiskeysockets/baileys");

const BOT_NAME = "Malvin C Sprint";
const AUTHOR = "Handsome Tech";
const PREFIX = ".";

async function handleMessage(sock, msg) {
  try {
    const jid = msg.key.remoteJid;
    const isGroup = jid.endsWith("@g.us");
    const pushName = msg.pushName || "User";
    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      "";

    if (!body.startsWith(PREFIX)) {
      await handleAutoReply(sock, jid, body, pushName);
      return;
    }

    const args = body.slice(PREFIX.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    console.log(`[CMD] ${pushName} → ${PREFIX}${command}`);

    switch (command) {
      case "ping":
        await reply(sock, jid, msg, `🏓 *Pong!*\n\n_${BOT_NAME} is alive!_`);
        break;

      case "help":
      case "menu":
        await reply(sock, jid, msg,
          `╔═══════════════════╗\n` +
          `║   *${BOT_NAME}*   ║\n` +
          `║   Made by ${AUTHOR}  ║\n` +
          `╚═══════════════════╝\n\n` +
          `*General Commands:*\n` +
          `▸ \`${PREFIX}ping\` — Check bot status\n` +
          `▸ \`${PREFIX}help\` — Show this menu\n` +
          `▸ \`${PREFIX}info\` — Bot information\n` +
          `▸ \`${PREFIX}alive\` — Are you alive?\n\n` +
          `*Group Commands:*\n` +
          `▸ \`${PREFIX}tagall\` — Tag everyone\n` +
          `▸ \`${PREFIX}hidetag\` — Hidden tag all\n\n` +
          `*Media Commands:*\n` +
          `▸ \`${PREFIX}sticker\` — Make sticker\n` +
          `▸ \`${PREFIX}toimg\` — Convert sticker to image\n\n` +
          `_Prefix: \`${PREFIX}\`_`
        );
        break;

      case "info":
        await reply(sock, jid, msg,
          `🤖 *Bot Information*\n\n` +
          `▸ Name: *${BOT_NAME}*\n` +
          `▸ Author: *${AUTHOR}*\n` +
          `▸ Platform: WhatsApp Multi-Device\n` +
          `▸ Deployment: Vercel\n` +
          `▸ Status: 🟢 Online\n` +
          `▸ Prefix: \`${PREFIX}\`\n\n` +
          `_Built with ❤️ by ${AUTHOR}_`
        );
        break;

      case "alive":
        await reply(sock, jid, msg,
          `✅ *${BOT_NAME} is alive!*\n\n` +
          `👨‍💻 Made by: ${AUTHOR}\n` +
          `⏱ Uptime: ${formatUptime(process.uptime())}\n` +
          `💾 Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)}MB`
        );
        break;

      case "tagall":
        if (!isGroup) { await reply(sock, jid, msg, "❌ This command only works in groups."); break; }
        await tagAll(sock, jid, msg, args.join(" ") || "📢 Attention everyone!");
        break;

      case "hidetag":
        if (!isGroup) { await reply(sock, jid, msg, "❌ This command only works in groups."); break; }
        await hideTag(sock, jid, msg);
        break;

      case "sticker":
      case "s":
        await reply(sock, jid, msg, "📎 Reply to an image/video with .sticker to convert it.");
        break;

      case "owner":
        await reply(sock, jid, msg,
          `👨‍💻 *Bot Owner*\n\nThis bot was made by *${AUTHOR}*\n\nBot: *${BOT_NAME}*`
        );
        break;

      default:
        await reply(sock, jid, msg,
          `❓ Unknown command: \`${PREFIX}${command}\`\n\nSend \`${PREFIX}help\` for available commands.`
        );
    }
  } catch (err) {
    console.error("Handler error:", err);
  }
}

async function handleAutoReply(sock, jid, body, name) {
  const lower = body.toLowerCase();
  if (["hi", "hello", "hey", "hii"].includes(lower)) {
    await sock.sendMessage(jid, {
      text: `👋 Hello *${name}!*\n\nI'm *${BOT_NAME}*, made by *${AUTHOR}*.\n\nType \`${PREFIX}help\` to see what I can do!`,
    });
  }
}

async function reply(sock, jid, msg, text) {
  await sock.sendMessage(jid, { text }, { quoted: msg });
}

async function tagAll(sock, jid, msg, announcement) {
  try {
    const groupMeta = await sock.groupMetadata(jid);
    const members = groupMeta.participants;
    const mentions = members.map((m) => m.id);
    const text =
      `📢 *${announcement}*\n\n` +
      members.map((m, i) => `${i + 1}. @${m.id.split("@")[0]}`).join("\n");
    await sock.sendMessage(jid, { text, mentions }, { quoted: msg });
  } catch (err) {
    await reply(sock, jid, msg, "❌ Failed to fetch group members.");
  }
}

async function hideTag(sock, jid, msg) {
  try {
    const groupMeta = await sock.groupMetadata(jid);
    const mentions = groupMeta.participants.map((m) => m.id);
    await sock.sendMessage(jid, { text: "‎", mentions });
  } catch (err) {
    await reply(sock, jid, msg, "❌ Failed to send hidetag.");
  }
}

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

module.exports = { handleMessage };
