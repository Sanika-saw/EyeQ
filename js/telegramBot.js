/**
 * EyeQ Retail Intelligence - Telegram Bot Integration Service
 * Dispatches real-time shelf void detection & operational telemetry alerts to Telegram.
 */
import { store } from './state.js';
import { TELEGRAM_CONFIG } from './config.js';

export class TelegramBotService {
  constructor(toastManager) {
    this.toastManager = toastManager;
    this.init();
  }

  init() {
    const state = store.getState();

    // Load credentials from backend config.js (or fallback to localStorage if set)
    const token = TELEGRAM_CONFIG.BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE' 
      ? TELEGRAM_CONFIG.BOT_TOKEN 
      : (localStorage.getItem('eyeq_telegram_bot_token') || '');

    const chatId = TELEGRAM_CONFIG.CHAT_ID !== 'YOUR_CHAT_ID_HERE'
      ? TELEGRAM_CONFIG.CHAT_ID
      : (localStorage.getItem('eyeq_telegram_chat_id') || '');

    state.telegramBot.botToken = token;
    state.telegramBot.chatId = chatId;

    // Listen to void detections & alert dispatches
    store.subscribe((event, data) => {
      if (event === 'void_detected') {
        this.sendVoidAlert(data);
      } else if (event === 'counter4_activated') {
        this.sendSurgeMitigatedAlert();
      }
    });
  }

  saveCredentials(token, chatId) {
    const state = store.getState();
    state.telegramBot.botToken = token.trim();
    state.telegramBot.chatId = chatId.trim();

    localStorage.setItem('eyeq_telegram_bot_token', token.trim());
    localStorage.setItem('eyeq_telegram_chat_id', chatId.trim());
  }

  async testConnection() {
    const state = store.getState();
    const token = state.telegramBot.botToken;
    const chatId = state.telegramBot.chatId;

    if (!token) {
      throw new Error('Telegram Bot API Token is missing.');
    }

    // 1. Verify Bot Token with getMe
    const getMeUrl = `https://api.telegram.org/bot${token}/getMe`;
    const getMeRes = await fetch(getMeUrl);
    const getMeData = await getMeRes.json();

    if (!getMeData.ok) {
      throw new Error(`Bot Authentication Failed: ${getMeData.description || 'Invalid Token'}`);
    }

    const botName = getMeData.result.first_name || getMeData.result.username;

    // 2. If Chat ID is provided, send a test message
    if (chatId) {
      const msg = `🤖 *EyeQ Store Intelligence Bot Connected!*\n\n📍 *Store:* ${state.storeName} — ${state.storeLocation}\n👤 *Director:* ${state.storeDirector}\n✅ *Status:* Real-time YOLOv8 Shelf Void & Congestion Alerts Online.`;
      await this.sendMessage(msg);
    }

    return botName;
  }

  async sendMessage(textMarkdown) {
    const state = store.getState();
    const token = state.telegramBot.botToken;
    const chatId = state.telegramBot.chatId;

    if (!token || !chatId) {
      console.warn('Telegram Bot Token or Chat ID not configured. Skipping alert dispatch.');
      return false;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: textMarkdown,
      parse_mode: 'Markdown'
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!data.ok) {
        console.error('Telegram API Error:', data.description);
        // Fallback retry without parse_mode
        const fallbackRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: textMarkdown.replace(/[*_`]/g, '') })
        });
        const fallbackData = await fallbackRes.json();
        return fallbackData.ok;
      }
      return true;
    } catch (err) {
      console.error('Failed to send Telegram message:', err);
      return false;
    }
  }

  async sendVoidAlert(alertData) {
    const state = store.getState();
    if (!state.telegramBot.botToken || !state.telegramBot.chatId) return;

    const voidInfo = alertData.voidData;
    const voidsList = voidInfo.voids.map(v => `• *${v.label}* (${(parseFloat(v.confidence)*100).toFixed(0)}% conf): ${v.sku} at _${v.location}_`).join('\n');

    const message = 
`🚨 *EYEQ ALERT: SHELF VOID DETECTED!*

📍 *Location:* ${voidInfo.title}
🏪 *Store:* ${state.storeName} (${state.storeLocation})
⏱ *Time:* ${new Date().toLocaleTimeString()} IST

🔍 *YOLOv8 Vision Model Output:*
${voidsList}

⚠️ *Action Required:* Shelf restock associate dispatch recommended immediately.`;

    const sent = await this.sendMessage(message);
    if (sent && this.toastManager) {
      this.toastManager.show('Telegram alert dispatched to Telegram Bot channel.', 'success');
    }
  }

  async sendSurgeMitigatedAlert() {
    const state = store.getState();
    if (!state.telegramBot.botToken || !state.telegramBot.chatId) return;

    const message = 
`⚡ *EYEQ ALERT: SURGE MITIGATED*

📍 *Billing Counters 1-4*
✅ *Action Taken:* Counter 04 (Express) Activated by Pooja R.
⏱ *Avg Queue Wait:* Reduced to 1m 55s (SLA Compliant).`;

    await this.sendMessage(message);
  }
}
