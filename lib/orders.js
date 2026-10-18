import { db, adminChatIds, getSettings } from './db.js';
import { tg, tgPhoto } from './telegram.js';
import { escHtml, fmtSum } from './util.js';

export const STATUSES = {
  awaiting_payment: { icon: '⏳', uz: "To'lov kutilmoqda", ru: 'Ожидает оплаты' },
  checking: { icon: '🔎', uz: "To'lov tekshirilmoqda", ru: 'Оплата проверяется' },
  paid: { icon: '✅', uz: "To'landi", ru: 'Оплачен' },
  shipping: { icon: '🚚', uz: "Yo'lda", ru: 'В пути' },
  delivered: { icon: '📦', uz: 'Yetkazildi', ru: 'Доставлен' },
  rejected: { icon: '⚠️', uz: "To'lov rad etildi", ru: 'Оплата отклонена' },
  cancelled: { icon: '❌', uz: 'Bekor qilindi', ru: 'Отменён' },
};

const CUSTOMER_TEXT = {
  paid: {
    uz: (o) => `✅ <b>Buyurtma #${o.id}</b> to'lovi tasdiqlandi!\n\nBuyurtmangizni tayyorlayapmiz va tez orada jo'natamiz. Rahmat!`,
    ru: (o) => `✅ Оплата <b>заказа #${o.id}</b> подтверждена!\n\nГотовим ваш заказ и скоро отправим. Спасибо!`,
  },
  shipping: {
    uz: (o) => `🚚 <b>Buyurtma #${o.id}</b> yo'lga chiqdi.\n\nTez orada sizga yetib boradi.`,
    ru: (o) => `🚚 <b>Заказ #${o.id}</b> отправлен.\n\nСкоро он будет у вас.`,
  },
  delivered: {
    uz: (o) => `📦 <b>Buyurtma #${o.id}</b> yetkazildi.\n\nXaridingiz uchun rahmat! ISTANBUL BRAND'ni tanlaganingizdan xursandmiz.`,
    ru: (o) => `📦 <b>Заказ #${o.id}</b> доставлен.\n\nСпасибо за покупку в ISTANBUL BRAND!`,
  },
  rejected: {
    uz: (o, s) => `⚠️ <b>Buyurtma #${o.id}</b> to'lovi tasdiqlanmadi.${o.admin_note ? `\n\nIzoh: ${escHtml(o.admin_note)}` : ''}\n\nIltimos, to'lovni tekshiring yoki biz bilan bog'laning: ${escHtml((s.phones || [])[0] || '')}`,
    ru: (o, s) => `⚠️ Оплата <b>заказа #${o.id}</b> не подтверждена.${o.admin_note ? `\n\nКомментарий: ${escHtml(o.admin_note)}` : ''}\n\nПожалуйста, проверьте оплату или свяжитесь с нами: ${escHtml((s.phones || [])[0] || '')}`,
  },
  cancelled: {
    uz: (o, s) => `❌ <b>Buyurtma #${o.id}</b> bekor qilindi.${o.admin_note ? `\n\nIzoh: ${escHtml(o.admin_note)}` : ''}\n\nSavollar bo'lsa: ${escHtml((s.phones || [])[0] || '')}`,
    ru: (o, s) => `❌ <b>Заказ #${o.id}</b> отменён.${o.admin_note ? `\n\nКомментарий: ${escHtml(o.admin_note)}` : ''}\n\nВопросы: ${escHtml((s.phones || [])[0] || '')}`,
  },
};

// Admin uchun keyingi qadam tugmalari
const NEXT_ACTIONS = {
  checking: [['paid', "✅ To'lov tasdiqlandi"], ['rejected', '⚠️ Rad etish']],
  awaiting_payment: [['paid', "✅ To'langan deb belgilash"], ['cancelled', '❌ Bekor qilish']],
  paid: [['shipping', "🚚 Yo'lga chiqdi"], ['cancelled', '❌ Bekor qilish']],
  shipping: [['delivered', '📦 Yetkazildi']],
  rejected: [['paid', "✅ Baribir tasdiqlash"], ['cancelled', '❌ Bekor qilish']],
  delivered: [],
  cancelled: [],
};

export function adminKeyboard(order, baseUrl) {
  const st = STATUSES[order.status] || { icon: '', uz: order.status };
  const rows = [[{ text: `Holat: ${st.icon} ${st.uz}`, callback_data: 'noop' }]];
  const next = NEXT_ACTIONS[order.status] || [];
  if (next.length) rows.push(next.map(([s, label]) => ({ text: label, callback_data: `st:${order.id}:${s}` })));
  if (baseUrl && baseUrl.startsWith('https://')) rows.push([{ text: '🖥 Admin panelda ochish', url: `${baseUrl}/admin#order-${order.id}` }]);
  return { inline_keyboard: rows };
}

export function orderAdminText(o) {
  const items = (o.items || []).map((it, i) =>
    `${i + 1}. ${escHtml(it.name)}${it.color ? ` (${escHtml(it.color)})` : ''} — <b>${escHtml(it.size || '')}</b> × ${it.qty} = ${fmtSum(it.price * it.qty)}`).join('\n');
  const delivery = o.delivery_type === 'pickup'
    ? "🏬 Do'kondan olib ketadi"
    : `🚚 ${escHtml(o.region || '')}${o.address ? `, ${escHtml(o.address)}` : ''}`;
  const pay = o.payment_method === 'online' ? '💳 Onlayn (Click/Payme)' : "💳 Kartaga o'tkazma — chek ilova qilingan";
  return [
    `🛍 <b>Yangi buyurtma #${o.id}</b>`,
    '',
    `👤 <b>${escHtml(o.customer_name)}</b>${o.username ? ` (@${escHtml(o.username)})` : ''}`,
    `📞 ${escHtml(o.phone)}`,
    delivery,
    o.comment ? `💬 ${escHtml(o.comment)}` : null,
    '',
    items,
    '',
    `Mahsulotlar: ${fmtSum(o.subtotal)}`,
    o.delivery_type === 'pickup' ? null : `Yetkazish: ${o.delivery_price ? fmtSum(o.delivery_price) : 'bepul'}`,
    `💰 <b>Jami: ${fmtSum(o.total)}</b>`,
    pay,
  ].filter((l) => l !== null).join('\n');
}

export async function notifyAdminsNewOrder(order, receipt) {
  const ids = await adminChatIds();
  if (!ids.length) return;
  const s = await getSettings();
  const base = process.env.WEBAPP_URL || s.webapp_url || '';
  await Promise.allSettled(ids.map(async (chat) => {
    if (receipt) await tgPhoto(chat, receipt.buf, receipt.mime, `🧾 <b>#${order.id}</b> — to'lov cheki · ${fmtSum(order.total)}`);
    await tg('sendMessage', {
      chat_id: chat,
      text: orderAdminText(order),
      parse_mode: 'HTML',
      reply_markup: adminKeyboard(order, base),
      link_preview_options: { is_disabled: true },
    });
  }));
}

export async function notifyAdmins(text) {
  const ids = await adminChatIds();
  await Promise.allSettled(ids.map((chat) => tg('sendMessage', { chat_id: chat, text, parse_mode: 'HTML' })));
}

// Buyurtma holatini o'zgartiradi, sotuvlar sonini yangilaydi va mijozga xabar yuboradi
export async function setOrderStatus(id, status, { note, notify = true, chargeId } = {}) {
  if (!STATUSES[status]) throw new Error('Noto\'g\'ri holat');
  const sql = db();
  const [prev] = await sql`select id, status, paid_at, items from orders where id = ${id}`;
  if (!prev) return null;
  const [o] = await sql`update orders set
      status = ${status},
      admin_note = coalesce(${note ?? null}, admin_note),
      payment_charge_id = coalesce(${chargeId ?? null}, payment_charge_id),
      paid_at = case when ${status} in ('paid','shipping','delivered') and paid_at is null then now() else paid_at end,
      updated_at = now()
    where id = ${id}
    returning *`;
  if (['paid', 'shipping', 'delivered'].includes(status) && !prev.paid_at) {
    await sql`update products p set sold_count = p.sold_count + x.qty
      from (select (e->>'id')::int as id, sum((e->>'qty')::int) as qty
            from jsonb_array_elements(${JSON.stringify(prev.items)}::jsonb) e group by 1) x
      where p.id = x.id`;
  }
  if (notify && o.tg_id && prev.status !== status && CUSTOMER_TEXT[status]) {
    const s = await getSettings();
    const [u] = await sql`select lang from users where tg_id = ${o.tg_id}`;
    const lang = u?.lang === 'ru' ? 'ru' : 'uz';
    const base = process.env.WEBAPP_URL || s.webapp_url || '';
    const markup = base.startsWith('https://')
      ? { inline_keyboard: [[{ text: lang === 'ru' ? '📦 Мои заказы' : '📦 Buyurtmalarim', web_app: { url: `${base}/#/order/${o.id}` } }]] }
      : undefined;
    await tg('sendMessage', { chat_id: o.tg_id, text: CUSTOMER_TEXT[status][lang](o, s), parse_mode: 'HTML', reply_markup: markup });
  }
  return o;
}
