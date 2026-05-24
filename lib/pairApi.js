// lib/pairApi.js — Web Pairing API Routes
// Malvin C Sprint | Made by Handsome Tech

const express = require("express");
const QRCode = require("qrcode");
const router = express.Router();

let latestQR = null;
let latestQRDataUrl = null;

function setLatestQR(qrString) {
  latestQR = qrString;
  QRCode.toDataURL(qrString, { width: 400, margin: 2 })
    .then((url) => { latestQRDataUrl = url; })
    .catch(() => {});
}

function clearQR() {
  latestQR = null;
  latestQRDataUrl = null;
}

// GET /api/pair/qr
router.get("/qr", async (req, res) => {
  const { getWhatsAppStatus } = require("./whatsapp");
  const status = getWhatsAppStatus();

  if (status.status === "connected") {
    return res.json({ status: "connected", message: "Already connected!" });
  }

  if (!latestQRDataUrl) {
    const { startWhatsApp } = require("./whatsapp");
    startWhatsApp().catch(() => {});
    let waited = 0;
    while (!latestQRDataUrl && waited < 8000) {
      await new Promise((r) => setTimeout(r, 500));
      waited += 500;
    }
  }

  if (latestQRDataUrl) return res.json({ qr: latestQRDataUrl });
  return res.status(503).json({ error: "QR not ready yet, try again in a moment." });
});

// POST /api/pair/code
router.post("/code", async (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length < 7) return res.status(400).json({ error: "Invalid phone number." });

  const cleanPhone = String(phone).replace(/\D/g, "");

  try {
    const { getSocket, startWhatsApp } = require("./whatsapp");
    let sock = getSocket();
    if (!sock) {
      await startWhatsApp();
      await new Promise((r) => setTimeout(r, 3000));
      sock = getSocket();
    }
    if (!sock) return res.status(503).json({ error: "WhatsApp engine not ready. Try again." });

    const code = await sock.requestPairingCode(cleanPhone);
    return res.json({ code, phone: cleanPhone });
  } catch (err) {
    console.error("Pairing code error:", err.message);
    return res.status(500).json({ error: err.message || "Failed to generate pairing code." });
  }
});

module.exports = { router, setLatestQR, clearQR };
