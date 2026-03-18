import { FastifyInstance } from 'fastify';
import { handleTelegramMessage } from './bot.js';

export async function telegramRoutes(app: FastifyInstance) {
  app.post('/telegram/webhook', async (req: any, reply: any) => {
    try {
      const { message } = req.body;
      if (!message?.text || !message?.chat?.id) return reply.send({ ok: true });
      const chatId = String(message.chat.id);
      const text = message.text;
      reply.send({ ok: true });
      const response = await handleTelegramMessage(text);
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: response, parse_mode: 'Markdown' })
      });
    } catch (e) {
      console.error('Webhook error:', e);
      reply.send({ ok: true });
    }
  });
}
