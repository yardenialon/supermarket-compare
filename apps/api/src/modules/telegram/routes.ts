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

      // Process message and send response
      const response = await handleTelegramMessage(text);
      console.log('Bot response:', response?.slice(0, 100));

      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: response, parse_mode: 'Markdown' })
      }).then(r => r.json()).then(r => console.log('TG response:', JSON.stringify(r)));

      return reply.send({ ok: true });
    } catch (e) {
      console.error('Webhook error:', e);
      return reply.send({ ok: true });
    }
  });
}
