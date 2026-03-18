import { FastifyInstance } from 'fastify';
import { handleTelegramMessage } from './bot.js';

const TELEGRAM_API = 'https://api.telegram.org/bot';
const userLocations = new Map<string, { lat: number; lng: number; timestamp: number }>();

async function sendMessage(token: string, chatId: string, text: string) {
  await fetch(TELEGRAM_API + token + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
  }).then(r => r.json()).then(r => { if (!r.ok) console.error('TG error:', JSON.stringify(r)); });
}

export async function telegramRoutes(app: FastifyInstance) {
  app.post('/telegram/webhook', async (req: any, reply: any) => {
    try {
      const { message } = req.body;
      if (!message) return reply.send({ ok: true });

      const chatId = String(message.chat.id);
      const token = process.env.TELEGRAM_BOT_TOKEN || '8729757551:AAGUz8eN0Da59_YwgYBCu1MXH2uLnVWa74c';

      // Handle location
      if (message.location) {
        const { latitude, longitude } = message.location;
        userLocations.set(chatId, { lat: latitude, lng: longitude, timestamp: Date.now() });
        console.log('Location saved for', chatId, latitude, longitude);
        await sendMessage(token, chatId, '📍 מיקום התקבל! עכשיו שלח לי רשימת קניות ואמצא לך את הסניף הזול ביותר קרוב אליך 🛒');
        return reply.send({ ok: true });
      }

      if (!message.text) return reply.send({ ok: true });

      const text = message.text;

      // Handle /start
      if (text === '/start') {
        await sendMessage(token, chatId, 'שלום! אני סאבי - עוזר הקניות החכם שלך 🛒\n\nאני יכול לעזור לך למצוא את הסל הזול ביותר בסופרמרקטים בישראל.\n\nשלח לי רשימת קניות כמו:\n"חלב, לחם, ביצים, עגבניות"\n\n📍 לתוצאות לפי סניף קרוב אליך - שלח מיקום (📎 → Location)');
        return reply.send({ ok: true });
      }

      reply.send({ ok: true });

      // Get saved location (valid for 2 hours)
      const loc = userLocations.get(chatId);
      const hasValidLocation = loc && (Date.now() - loc.timestamp < 2 * 60 * 60 * 1000);

      const response = await handleTelegramMessage(text, hasValidLocation ? loc.lat : undefined, hasValidLocation ? loc.lng : undefined);

      const locationNote = hasValidLocation ? '' : '\n\n📍 _שלח מיקום לתוצאות קרובות אליך_';
      await sendMessage(token, chatId, response + locationNote);

    } catch (e) {
      console.error('Webhook error:', e);
      reply.send({ ok: true });
    }
  });
}
