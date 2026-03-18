import { FastifyInstance } from 'fastify';
import { handleTelegramMessage } from './bot.js';

export async function telegramRoutes(app: FastifyInstance) {
  app.post('/telegram/webhook', async (req: any, reply: any) => {
    try {
      const { message } = req.body;
      console.log('Webhook received:', JSON.stringify(message));
      
      if (!message?.text || !message?.chat?.id) {
        return reply.send({ ok: true });
      }

      const chatId = String(message.chat.id);
      const text = message.text;
      const token = process.env.TELEGRAM_BOT_TOKEN || '8729757551:AAGUz8eN0Da59_YwgYBCu1MXH2uLnVWa74c';
      console.log('Token first 10 chars:', token?.slice(0, 10), 'length:', token?.length);

      const response = await handleTelegramMessage(text);
      console.log('Bot response:', response?.slice(0, 100));

      const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: response, parse_mode: 'Markdown' })
      });
      const tgJson = await tgRes.json();
      console.log('TG response:', JSON.stringify(tgJson));

      return reply.send({ ok: true });
    } catch (e) {
      console.error('Webhook error:', e);
      return reply.send({ ok: true });
    }
  });
}
