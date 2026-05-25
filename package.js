{
  "name": "malvin-c-sprint",
  "version": "1.0.0",
  "description": "WhatsApp Multi-Device Bot paired via Telegram — Made by Handsome Tech",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "bot": "node bot.js",
    "dev": "nodemon bot.js"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.7.9",
    "axios": "^1.7.2",
    "express": "^4.19.2",
    "node-telegram-bot-api": "^0.66.0",
    "pino": "^9.3.2",
    "qrcode": "^1.5.4",
    "qrcode-terminal": "^0.12.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.4"
  },
  "engines": {
    "node": ">=18.x"
  },
  "author": "Handsome Tech",
  "license": "MIT"
}
