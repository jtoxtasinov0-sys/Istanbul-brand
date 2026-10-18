import { db, getSettings, upsertUser } from '../lib/db.js';
import { verifyInitData } from '../lib/auth.js';
import { notifyAdminsNewOrder } from '../lib/orders.js';
import { tg } from '../lib/telegram.js';
import { HttpError, clean, cleanText, decodeImage, handler, normPhone, readJson, toInt } from '../lib/util.js';

export const REGIONS = [
  'Toshkent shahri', 'Toshkent viloyati', 'Andijon viloyati', "Farg'ona viloyati", 'Namangan viloyati',
  'Samarqand viloyati', 'Buxoro viloyati', 'Navoiy viloyati', 'Qashqadaryo viloyati', 'Surxondaryo viloyati',
  'Jizzax viloyati', 'Sirdaryo viloyati', 'Xorazm viloyati', "Qoraqalpog'iston Respublikasi",
];

export default handler(async (req, res) => {
  if (req.method === 'GET') return myOrders(req, res);
  if (req.method === 'POST') return createOrder(req, res);
  res.status(405).json({ error: 'Method not allowed' });
});

// Foydalanuvchining o'z buyurtmalari (Telegram initData orqali)
async function myOrders(req, res) {
  const user = verifyInitData(req.headers['x-telegram-init-data'], 30 * 86400);
  if (!user) throw new HttpError(401, 'Telegram orqali oching');
  const rows = await db()`select id, status, items, subtotal, delivery_price, total, delivery_type, region, address,
      payment_method, customer_name, phone, comment, admin_note, created_at, paid_at, updated_at
    from orders where tg_id = ${user.id} order by id desc limit 50`;
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ orders: rows });
}

async function createOrder(req, res) {
  const sql = db();
  const b = await readJson(req);
  const user = verifyInitData(b.initData);

  // --- mijoz ma'lumotlari
  const name = clean(b.name, 80);
  if (name.length < 2) throw new HttpError(400, 'Ismingizni kiriting');
  const phone = normPhone(b.phone);
  if (!phone) throw new HttpError(400, "Telefon raqamni to'g'ri kiriting");

  const s = await getSettings();
  const deliveryType = b.delivery === 'pickup' && s.pickup_enabled ? 'pickup' : 'delivery';
  const region = deliveryType === 'delivery' ? clean(b.region, 60) : null;
  const address = deliveryType === 'delivery' ? clean(b.address, 300) : null;
  if (deliveryType === 'delivery') {
    if (!REGIONS.includes(region)) throw new HttpError(400, 'Viloyatni tanlang');
    if (!address || address.length < 5) throw new HttpError(400, "Manzilni to'liq kiriting");
  }
  const comment = cleanText(b.comment, 500) || null;

  // --- savat: narxlar faqat bazadan olinadi
  const raw = Array.isArray(b.items) ? b.items.slice(0, 40) : [];
  const ids = [...new Set(raw.map((i) => toInt(i.id)).filter(Boolean))];
  if (!ids.length) throw new HttpError(400, "Savat bo'sh");
  const prods = await sql`select id, name, brand, color, sizes, price, images, is_active, in_stock
    from products where id = any(${ids})`;
  const byId = new Map(prods.map((p) => [p.id, p]));
  const merged = new Map();
  for (const it of raw) {
    const p = byId.get(toInt(it.id));
    if (!p || !p.is_active) throw new HttpError(409, "Savatdagi ba'zi mahsulotlar endi mavjud emas. Savatni yangilang.");
    if (!p.in_stock) throw new HttpError(409, `«${p.name}» hozir sotuvda yo'q`);
    const size = clean(it.size, 20);
    if (p.sizes?.length && !p.sizes.includes(size)) throw new HttpError(400, `«${p.name}» uchun o'lchamni tanlang`);
    const qty = Math.min(Math.max(toInt(it.qty, 1), 1), 20);
    const key = `${p.id}|${size}`;
    const prev = merged.get(key);
    if (prev) prev.qty = Math.min(prev.qty + qty, 20);
    else merged.set(key, { id: p.id, name: p.name, brand: p.brand, color: p.color, size, qty, price: p.price, image: p.images?.[0] || null });
  }
  const items = [...merged.values()];
  const subtotal = items.reduce((a, it) => a + it.price * it.qty, 0);
  const freeFrom = Number(s.free_delivery_from) || 0;
  const deliveryPrice = deliveryType === 'delivery' && !(freeFrom && subtotal >= freeFrom) ? Number(s.delivery_price) || 0 : 0;
  const total = subtotal + deliveryPrice;

  // --- to'lov: faqat karta
  const method = b.payment === 'online' ? 'online' : 'card';
  let receipt = null;
  if (method === 'card') {
    if (!s.card_number) throw new HttpError(400, "Do'kon karta raqami hali kiritilmagan. Iltimos, biz bilan bog'laning.");
    receipt = decodeImage(b.receipt);
    if (!receipt) throw new HttpError(400, "To'lov chekini (skrinshot) yuklang");
  } else if (!s.provider_token) {
    throw new HttpError(400, "Onlayn to'lov hozircha mavjud emas");
  }

  let receiptId = null;
  if (receipt) {
    const [img] = await sql`insert into images (kind, mime, data) values ('receipt', ${receipt.mime}, decode(${receipt.b64}, 'base64')) returning id`;
    receiptId = img.id;
  }

  const [order] = await sql`insert into orders
      (tg_id, username, customer_name, phone, delivery_type, region, address, comment, items,
       subtotal, delivery_price, total, payment_method, receipt_id, status)
    values (${user?.id || null}, ${user?.username || null}, ${name}, ${phone}, ${deliveryType}, ${region}, ${address}, ${comment},
       ${JSON.stringify(items)}::jsonb, ${subtotal}, ${deliveryPrice}, ${total}, ${method}, ${receiptId},
       ${method === 'card' ? 'checking' : 'awaiting_payment'})
    returning *`;

  if (user) await upsertUser(user, { phone, lang: b.lang === 'ru' ? 'ru' : 'uz' });

  if (method === 'card') {
    await notifyAdminsNewOrder(order, receipt);
    return res.status(200).json({ ok: true, id: order.id, status: order.status });
  }

  // Telegram Payments (Click/Payme provider token) orqali onlayn karta to'lovi
  const desc = items.map((it) => `${it.name} (${it.size}) ×${it.qty}`).join(', ').slice(0, 250);
  const inv = await tg('createInvoiceLink', {
    title: `${s.shop_name || 'ISTANBUL BRAND'} — #${order.id}`.slice(0, 32),
    description: desc || `Buyurtma #${order.id}`,
    payload: `order:${order.id}`,
    provider_token: s.provider_token,
    currency: 'UZS',
    prices: [{ label: `Buyurtma #${order.id}`, amount: total * 100 }],
  });
  if (!inv.ok) {
    await sql`update orders set status = 'cancelled', admin_note = 'Invoice yaratilmadi' where id = ${order.id}`;
    throw new HttpError(502, "Onlayn to'lovni boshlab bo'lmadi. Kartaga o'tkazma usulidan foydalaning.");
  }
  res.status(200).json({ ok: true, id: order.id, status: order.status, invoice_link: inv.result });
}
