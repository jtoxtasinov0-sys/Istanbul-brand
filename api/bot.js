import { db, adminChatIds, getSettings, saveSetting, upsertUser } from '../lib/db.js';
import { passwordOk, webhookSecret } from '../lib/auth.js';
import { STATUSES, adminKeyboard, notifyAdminsNewOrder, setOrderStatus } from '../lib/orders.js';
import { tg } from '../lib/telegram.js';
import { escHtml, fmtSum, handler } from '../lib/util.js';

// Telegram webhook
export default handler(async (req, res) => {
  if (req.method !== 'POST') return res.status(200).send('Istanbul Brand bot ishlayapti');
  if (req.headers['x-telegram-bot-api-secret-token'] !== webhookSecret()) return res.status(401).send('unauthorized');
  try {
    await route(req.body || {});
  } catch (e) {
    console.error('bot xato:', e);
  }
  res.status(200).json({ ok: true });
});

const baseUrl = (s) => (process.env.WEBAPP_URL || s.webapp_url || '').replace(/\/+$/, '');

async function route(u) {
  if (u.pre_checkout_query) return preCheckout(u.pre_checkout_query);
  if (u.callback_query) return onCallback(u.callback_query);
  const m = u.message;
  if (!m) return;
  if (m.successful_payment) return onPaid(m);
  if (m.chat?.type !== 'private' && !(m.text || '').startsWith('/admin')) return;

  const text = (m.text || '').trim();
  const lang = m.from?.language_code === 'ru' ? 'ru' : 'uz';
  if (m.from && m.chat.type === 'private') await upsertUser(m.from).catch(() => {});

  if (/^\/admin(@\w+)?(\s|$)/.test(text)) return onAdmin(m, text.split(/\s+/).slice(1).join(' '));
  if (/^\/id\b/.test(text)) return tg('sendMessage', { chat_id: m.chat.id, text: `Chat ID: <code>${m.chat.id}</code>`, parse_mode: 'HTML' });
  if (/^\/(orders|buyurtmalarim)\b/i.test(text)) return sendMyOrders(m.chat.id, m.from.id, lang);
  if (/^\/(aloqa|contact)\b/i.test(text)) return sendContact(m.chat.id, lang);
  return sendWelcome(m.chat.id, m.from, lang);
}

async function sendWelcome(chatId, from, lang) {
  const s = await getSettings();
  const base = baseUrl(s);
  const name = escHtml(from?.first_name || '');
  const caption = lang === 'ru'
    ? `Здравствуйте, ${name}! 👋\n\n<b>${escHtml(s.shop_name)}</b> — премиальная мужская одежда, обувь и аксессуары из Турции.\n\n🛍 Смотрите каталог, выбирайте размер и оформляйте заказ\n💳 Оплата — банковской картой\n🚚 Доставка по всему Узбекистану\n\nНажмите кнопку ниже, чтобы открыть магазин 👇`
    : `Assalomu alaykum, ${name}! 👋\n\n<b>${escHtml(s.shop_name)}</b> — Turkiyadan keltirilgan premium erkaklar kiyimlari, oyoq kiyimlari va aksessuarlar.\n\n🛍 Katalogni ko'ring, o'lchamni tanlang va buyurtma bering\n💳 To'lov — bank kartasi orqali\n🚚 O'zbekiston bo'ylab yetkazib beramiz\n\nDo'konni ochish uchun pastdagi tugmani bosing 👇`;
  const kb = [];
  if (base.startsWith('https://')) kb.push([{ text: lang === 'ru' ? '🛍 Открыть магазин' : "🛍 Do'konni ochish", web_app: { url: `${base}/` } }]);
  kb.push([
    { text: lang === 'ru' ? '📦 Мои заказы' : '📦 Buyurtmalarim', callback_data: 'my' },
    { text: lang === 'ru' ? '📞 Контакты' : '📞 Aloqa', callback_data: 'contact' },
  ]);
  if (s.instagram) kb.push([{ text: '📸 Instagram', url: `https://instagram.com/${s.instagram}` }]);
  const markup = { inline_keyboard: kb };
  if (base.startsWith('https://')) {
    const r = await tg('sendPhoto', { chat_id: chatId, photo: `${base}/img/welcome.jpg`, caption, parse_mode: 'HTML', reply_markup: markup });
    if (r.ok) return r;
  }
  return tg('sendMessage', { chat_id: chatId, text: caption, parse_mode: 'HTML', reply_markup: markup });
}

async function sendContact(chatId, lang) {
  const s = await getSettings();
  const lines = [
    `<b>${escHtml(s.shop_name)}</b>`,
    '',
    `📍 ${escHtml(s.address)}`,
    ...(s.phones || []).map((p) => `📞 ${escHtml(p)}`),
    s.working_hours ? `🕘 ${lang === 'ru' ? 'Время работы' : 'Ish vaqti'}: ${escHtml(s.working_hours)}` : null,
    s.instagram ? `📸 instagram.com/${escHtml(s.instagram)}` : null,
    s.telegram_contact ? `💬 @${escHtml(String(s.telegram_contact).replace(/^@/, ''))}` : null,
  ].filter((l) => l !== null);
  return tg('sendMessage', { chat_id: chatId, text: lines.join('\n'), parse_mode: 'HTML', link_preview_options: { is_disabled: true } });
}

async function sendMyOrders(chatId, userId, lang) {
  const rows = await db()`select id, status, total, created_at from orders where tg_id = ${userId} order by id desc limit 5`;
  if (!rows.length) {
    return tg('sendMessage', { chat_id: chatId, text: lang === 'ru' ? 'У вас пока нет заказов.' : "Sizda hali buyurtmalar yo'q." });
  }
  const s = await getSettings();
  const base = baseUrl(s);
  const lines = rows.map((o) => {
    const st = STATUSES[o.status] || { icon: '', uz: o.status, ru: o.status };
    return `<b>#${o.id}</b> · ${fmtSum(o.total)}\n${st.icon} ${st[lang]}`;
  });
  const markup = base.startsWith('https://')
    ? { inline_keyboard: [[{ text: lang === 'ru' ? 'Подробнее' : 'Batafsil', web_app: { url: `${base}/#/orders` } }]] }
    : undefined;
  return tg('sendMessage', {
    chat_id: chatId,
    text: `${lang === 'ru' ? '📦 <b>Последние заказы</b>' : "📦 <b>So'nggi buyurtmalar</b>"}\n\n${lines.join('\n\n')}`,
    parse_mode: 'HTML',
    reply_markup: markup,
  });
}

// "/admin PAROL" — shu chatni buyurtma bildirishnomalariga ulaydi
async function onAdmin(m, pw) {
  const chatId = m.chat.id;
  if (m.chat.type === 'private') await tg('deleteMessage', { chat_id: chatId, message_id: m.message_id });
  if (!pw || !passwordOk(pw)) {
    return tg('sendMessage', { chat_id: chatId, text: "❌ Parol noto'g'ri. Foydalanish: /admin PAROL" });
  }
  const s = await getSettings();
  const ids = new Set((s.admin_chat_ids || []).map(String));
  ids.add(String(chatId));
  await saveSetting('admin_chat_ids', [...ids]);
  return tg('sendMessage', {
    chat_id: chatId,
    text: `✅ Ushbu chat admin sifatida ulandi.\n\nYangi buyurtmalar va to'lov cheklari shu yerga keladi. To'lovni tasdiqlash tugmalari xabarlar ostida bo'ladi.\n\nChat ID: <code>${chatId}</code>`,
    parse_mode: 'HTML',
  });
}

async function onCallback(q) {
  const data = q.data || '';
  const chatId = q.message?.chat?.id;
  if (data === 'noop') return tg('answerCallbackQuery', { callback_query_id: q.id });
  if (data === 'my') {
    await tg('answerCallbackQuery', { callback_query_id: q.id });
    return sendMyOrders(chatId, q.from.id, q.from.language_code === 'ru' ? 'ru' : 'uz');
  }
  if (data === 'contact') {
    await tg('answerCallbackQuery', { callback_query_id: q.id });
    return sendContact(chatId, q.from.language_code === 'ru' ? 'ru' : 'uz');
  }
  const m = /^st:(\d+):(\w+)$/.exec(data);
  if (!m) return tg('answerCallbackQuery', { callback_query_id: q.id });

  const admins = await adminChatIds();
  if (!admins.includes(String(q.from.id)) && !admins.includes(String(chatId))) {
    return tg('answerCallbackQuery', { callback_query_id: q.id, text: "Sizda ruxsat yo'q", show_alert: true });
  }
  const order = await setOrderStatus(Number(m[1]), m[2]);
  if (!order) return tg('answerCallbackQuery', { callback_query_id: q.id, text: 'Buyurtma topilmadi', show_alert: true });
  const st = STATUSES[order.status];
  await tg('answerCallbackQuery', { callback_query_id: q.id, text: `#${order.id}: ${st.uz}` });
  const s = await getSettings();
  await tg('editMessageReplyMarkup', {
    chat_id: chatId,
    message_id: q.message.message_id,
    reply_markup: adminKeyboard(order, baseUrl(s)),
  });
}

async function preCheckout(q) {
  const id = Number(String(q.invoice_payload || '').replace('order:', ''));
  const [o] = id ? await db()`select id, status, total from orders where id = ${id}` : [];
  const ok = !!o && o.status === 'awaiting_payment' && o.total * 100 === q.total_amount && q.currency === 'UZS';
  return tg('answerPreCheckoutQuery', {
    pre_checkout_query_id: q.id,
    ok,
    ...(ok ? {} : { error_message: "Buyurtma topilmadi yoki muddati o'tgan. Iltimos, qaytadan buyurtma bering." }),
  });
}

async function onPaid(m) {
  const p = m.successful_payment;
  const id = Number(String(p.invoice_payload || '').replace('order:', ''));
  if (!id) return;
  const order = await setOrderStatus(id, 'paid', { chargeId: p.telegram_payment_charge_id });
  if (!order) return;
  await notifyAdminsNewOrder(order, null, "✅ <b>Onlayn to'lov qabul qilindi</b>");
}
