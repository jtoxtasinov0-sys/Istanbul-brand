import { saveSetting } from './db.js';
import { webhookSecret } from './auth.js';
import { tg } from './telegram.js';

// Webhook, menyu tugmasi, buyruqlar va bot tavsifini o'rnatadi
export async function setupBot(baseUrl) {
  const base = String(baseUrl).replace(/\/+$/, '');
  if (!base.startsWith('https://')) throw new Error('Bot uchun https manzil kerak');
  const results = {};
  results.webhook = await tg('setWebhook', {
    url: `${base}/api/bot`,
    secret_token: webhookSecret(),
    allowed_updates: ['message', 'callback_query', 'pre_checkout_query'],
    drop_pending_updates: false,
  });
  results.menu = await tg('setChatMenuButton', {
    menu_button: { type: 'web_app', text: "Do'kon", web_app: { url: `${base}/` } },
  });
  results.commands = await tg('setMyCommands', {
    commands: [
      { command: 'start', description: "Do'konni ochish" },
      { command: 'buyurtmalarim', description: 'Buyurtmalarim holati' },
      { command: 'aloqa', description: "Manzil va telefonlar" },
    ],
  });
  await tg('setMyCommands', {
    language_code: 'ru',
    commands: [
      { command: 'start', description: 'Открыть магазин' },
      { command: 'buyurtmalarim', description: 'Мои заказы' },
      { command: 'aloqa', description: 'Адрес и телефоны' },
    ],
  });
  results.description = await tg('setMyDescription', {
    description: "ISTANBUL BRAND — Turkiyadan keltirilgan premium erkaklar kiyimlari, oyoq kiyimlari va aksessuarlar.\n\n🛍 Katalog, o'lcham tanlash va buyurtma\n💳 Bank kartasi orqali to'lov\n🚚 O'zbekiston bo'ylab yetkazib berish\n\nBoshlash uchun «Start» tugmasini bosing.",
  });
  await tg('setMyShortDescription', {
    short_description: "Premium erkaklar kiyimlari · Turkiya · O'zbekiston bo'ylab yetkazib berish",
  });
  await saveSetting('webapp_url', base);
  return results;
}
