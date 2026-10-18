import { db, DEFAULT_SETTINGS, getSettings, saveSetting } from '../lib/db.js';
import { isAdmin, passwordOk, signAdminToken } from '../lib/auth.js';
import { setupBot } from '../lib/botsetup.js';
import { STATUSES, notifyAdmins, setOrderStatus } from '../lib/orders.js';
import { tg } from '../lib/telegram.js';
import { HttpError, clean, cleanText, decodeImage, handler, hostUrl, readJson, toInt } from '../lib/util.js';

const TZ = 'Asia/Tashkent';

const actions = {
  login, stats, orders, order, 'order-status': orderStatus, 'order-note': orderNote, receipt,
  products, 'product-save': productSave, 'product-delete': productDelete, 'product-patch': productPatch,
  upload, categories, 'category-save': categorySave, 'category-delete': categoryDelete,
  promos, 'promo-save': promoSave, 'promo-delete': promoDelete, 'promo-sort': promoSort,
  customers, 'admin-chat': adminChat, settings, 'settings-save': settingsSave,
  'bot-info': botInfo, 'bot-setup': botSetupAction, 'bot-test': botTest,
};

export default handler(async (req, res) => {
  const action = String(req.query.action || '');
  const fn = actions[action];
  if (!fn) throw new HttpError(404, 'Noma\'lum amal');
  if (action !== 'login' && !isAdmin(req)) throw new HttpError(401, 'Qaytadan kiring');
  res.setHeader('Cache-Control', 'no-store');
  const body = req.method === 'POST' ? await readJson(req) : {};
  const out = await fn(req, body, res);
  if (out !== undefined && !res.headersSent) res.status(200).json(out);
});

// ---------- auth
async function login(req, b) {
  if (req.method !== 'POST') throw new HttpError(405, 'POST kerak');
  if (!passwordOk(b.password)) {
    await new Promise((r) => setTimeout(r, 700));
    throw new HttpError(401, "Parol noto'g'ri");
  }
  return { token: signAdminToken() };
}

// ---------- dashboard
async function stats() {
  const sql = db();
  const [[totals], days, recent, [counts], s] = await Promise.all([
    sql`select
        count(*) filter (where created_at >= date_trunc('day', now() at time zone ${TZ}) at time zone ${TZ})::int as today_orders,
        coalesce(sum(total) filter (where status in ('paid','shipping','delivered') and paid_at >= date_trunc('day', now() at time zone ${TZ}) at time zone ${TZ}), 0)::bigint as today_revenue,
        coalesce(sum(total) filter (where status in ('paid','shipping','delivered') and paid_at >= now() - interval '30 days'), 0)::bigint as month_revenue,
        count(*) filter (where status = 'checking')::int as checking,
        count(*) filter (where status = 'paid')::int as to_ship,
        count(*)::int as total_orders
      from orders`,
    sql`select to_char(d, 'YYYY-MM-DD') as day,
          coalesce(sum(o.total), 0)::bigint as revenue, count(o.id)::int as orders
        from generate_series((now() at time zone ${TZ})::date - 13, (now() at time zone ${TZ})::date, interval '1 day') d
        left join orders o on (o.paid_at at time zone ${TZ})::date = d::date and o.status in ('paid','shipping','delivered')
        group by d order by d`,
    sql`select id, customer_name, phone, total, status, created_at, items from orders order by id desc limit 8`,
    sql`select (select count(*) from products)::int as products, (select count(*) from products where is_active)::int as active_products,
               (select count(*) from users)::int as customers, (select count(*) from categories)::int as categories`,
    getSettings(),
  ]);
  return {
    totals: { ...totals, ...counts },
    days,
    recent,
    setup: {
      card: !!s.card_number,
      admins: (s.admin_chat_ids || []).length > 0,
      webapp_url: s.webapp_url || '',
    },
  };
}

// ---------- orders
async function orders(req) {
  const sql = db();
  const status = STATUSES[req.query.status] ? req.query.status : null;
  const q = clean(req.query.q, 60);
  const offset = Math.max(toInt(req.query.offset, 0), 0);
  const like = q ? `%${q}%` : null;
  const idq = toInt(q?.replace('#', ''));
  const rows = await sql.query(
    `select id, tg_id, username, customer_name, phone, delivery_type, region, total, payment_method, status, created_at, items
       from orders
      where ($1::text is null or status = $1)
        and ($2::text is null or customer_name ilike $2 or phone ilike $2 or username ilike $2 or id = $3)
      order by id desc limit 50 offset $4`,
    [status, like, idq || -1, offset],
  );
  const counts = await sql`select status, count(*)::int as n from orders group by status`;
  return { orders: rows, counts: Object.fromEntries(counts.map((c) => [c.status, c.n])) };
}

async function order(req) {
  const id = toInt(req.query.id);
  const [o] = await db()`select o.*, u.first_name, u.last_name, u.photo_url
    from orders o left join users u on u.tg_id = o.tg_id where o.id = ${id}`;
  if (!o) throw new HttpError(404, 'Buyurtma topilmadi');
  return { order: o };
}

async function orderStatus(req, b) {
  const id = toInt(b.id);
  if (!STATUSES[b.status]) throw new HttpError(400, "Noto'g'ri holat");
  const o = await setOrderStatus(id, b.status, { note: b.note ? cleanText(b.note, 500) : null, notify: b.notify !== false });
  if (!o) throw new HttpError(404, 'Buyurtma topilmadi');
  return { order: o };
}

async function orderNote(req, b) {
  const [o] = await db()`update orders set admin_note = ${cleanText(b.note, 500) || null}, updated_at = now()
    where id = ${toInt(b.id)} returning id, admin_note`;
  if (!o) throw new HttpError(404, 'Buyurtma topilmadi');
  return { order: o };
}

async function receipt(req, b, res) {
  const id = toInt(req.query.id);
  const [row] = await db()`select i.mime, encode(i.data, 'base64') as b64
    from orders o join images i on i.id = o.receipt_id where o.id = ${id}`;
  if (!row) throw new HttpError(404, 'Chek topilmadi');
  res.setHeader('Content-Type', row.mime);
  res.status(200).send(Buffer.from(row.b64, 'base64'));
}

// ---------- products
async function products() {
  const rows = await db()`select p.*, c.name as category_name
    from products p left join categories c on c.id = p.category_id
    order by p.id desc`;
  return { products: rows };
}

function normSizes(v) {
  const arr = Array.isArray(v) ? v : String(v || '').split(',');
  return [...new Set(arr.map((x) => clean(x, 20)).filter(Boolean))].slice(0, 30);
}

function normImages(v) {
  const arr = Array.isArray(v) ? v : [];
  return arr.map((x) => String(x).trim()).filter((x) => /^(\/|https:\/\/)/.test(x)).slice(0, 10);
}

async function productSave(req, b) {
  const sql = db();
  const name = clean(b.name, 120);
  if (name.length < 2) throw new HttpError(400, 'Mahsulot nomini kiriting');
  const price = toInt(b.price);
  if (!price || price < 0) throw new HttpError(400, 'Narxni kiriting');
  const oldPrice = toInt(b.old_price);
  const p = {
    category_id: toInt(b.category_id),
    name,
    brand: clean(b.brand, 60) || null,
    badge: clean(b.badge, 20) || null,
    color: clean(b.color, 60) || null,
    description: cleanText(b.description, 2000) || null,
    sizes: normSizes(b.sizes),
    price,
    old_price: oldPrice && oldPrice > price ? oldPrice : null,
    images: normImages(b.images),
    is_active: b.is_active !== false,
    in_stock: b.in_stock !== false,
    is_new: !!b.is_new,
    is_featured: !!b.is_featured,
    sort: toInt(b.sort, 0),
  };
  const id = toInt(b.id);
  if (id) {
    const [row] = await sql`update products set
        category_id = ${p.category_id}, name = ${p.name}, brand = ${p.brand}, badge = ${p.badge}, color = ${p.color},
        description = ${p.description}, sizes = ${p.sizes}, price = ${p.price}, old_price = ${p.old_price},
        images = ${p.images}, is_active = ${p.is_active}, in_stock = ${p.in_stock}, is_new = ${p.is_new},
        is_featured = ${p.is_featured}, sort = ${p.sort}, updated_at = now()
      where id = ${id} returning *`;
    if (!row) throw new HttpError(404, 'Mahsulot topilmadi');
    return { product: row };
  }
  const [row] = await sql`insert into products
      (category_id, name, brand, badge, color, description, sizes, price, old_price, images, is_active, in_stock, is_new, is_featured, sort)
    values (${p.category_id}, ${p.name}, ${p.brand}, ${p.badge}, ${p.color}, ${p.description}, ${p.sizes}, ${p.price},
            ${p.old_price}, ${p.images}, ${p.is_active}, ${p.in_stock}, ${p.is_new}, ${p.is_featured}, ${p.sort})
    returning *`;
  return { product: row };
}

async function productDelete(req, b) {
  await db()`delete from products where id = ${toInt(b.id)}`;
  return { ok: true };
}

const PATCHABLE = new Set(['is_active', 'in_stock', 'is_new', 'is_featured']);
async function productPatch(req, b) {
  if (!PATCHABLE.has(b.field)) throw new HttpError(400, "Noto'g'ri maydon");
  const [row] = await db().query(
    `update products set ${b.field} = $1, updated_at = now() where id = $2 returning *`,
    [!!b.value, toInt(b.id)],
  );
  return { product: row };
}

async function upload(req, b) {
  const img = decodeImage(b, 3_000_000);
  if (!img) throw new HttpError(400, 'Rasm topilmadi');
  const [row] = await db()`insert into images (kind, mime, data) values ('product', ${img.mime}, decode(${img.b64}, 'base64')) returning id`;
  return { id: row.id, url: `/api/img?id=${row.id}` };
}

// ---------- categories
async function categories() {
  const rows = await db()`select c.*, count(p.id)::int as products
    from categories c left join products p on p.category_id = c.id
    group by c.id order by c.sort, c.id`;
  return { categories: rows };
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[ʻʼ'`’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `kat-${Date.now()}`;
}

async function categorySave(req, b) {
  const sql = db();
  const name = clean(b.name, 60);
  if (name.length < 2) throw new HttpError(400, 'Kategoriya nomini kiriting');
  const c = {
    name,
    name_ru: clean(b.name_ru, 60) || null,
    image: normImages([b.image])[0] || null,
    sort: toInt(b.sort, 0),
    is_active: b.is_active !== false,
  };
  const id = toInt(b.id);
  if (id) {
    const [row] = await sql`update categories set name = ${c.name}, name_ru = ${c.name_ru}, image = ${c.image},
      sort = ${c.sort}, is_active = ${c.is_active} where id = ${id} returning *`;
    return { category: row };
  }
  let slug = slugify(name);
  const [exists] = await sql`select 1 from categories where slug = ${slug}`;
  if (exists) slug = `${slug}-${Date.now().toString(36)}`;
  const [row] = await sql`insert into categories (slug, name, name_ru, image, sort, is_active)
    values (${slug}, ${c.name}, ${c.name_ru}, ${c.image}, ${c.sort}, ${c.is_active}) returning *`;
  return { category: row };
}

async function categoryDelete(req, b) {
  await db()`delete from categories where id = ${toInt(b.id)}`;
  return { ok: true };
}

// ---------- promos: bosh sahifadagi storislar va bannerlar
const PROMO_KINDS = new Set(['story', 'banner']);

async function promos() {
  const rows = await db()`select * from promos order by sort, id`;
  return { promos: rows };
}

// Rasm galereyadan yuklangan bo'lishi yoki mahsulotdan olinishi mumkin; rasm bo'lmasa mahsulotning asosiy rasmi ishlatiladi
async function promoSave(req, b) {
  const sql = db();
  if (!PROMO_KINDS.has(b.kind)) throw new HttpError(400, "Noto'g'ri tur");
  const x = {
    image: normImages([b.image])[0] || null,
    title: clean(b.title, 80) || null,
    subtitle: clean(b.subtitle, 120) || null,
    product_id: toInt(b.product_id),
    category_id: toInt(b.category_id),
    is_active: b.is_active !== false,
  };
  if (x.product_id) x.category_id = null;
  if (!x.image && !x.product_id) throw new HttpError(400, 'Rasm yuklang yoki mahsulot tanlang');
  const id = toInt(b.id);
  if (id) {
    const [row] = await sql`update promos set image = ${x.image}, title = ${x.title}, subtitle = ${x.subtitle},
        product_id = ${x.product_id}, category_id = ${x.category_id}, is_active = ${x.is_active}
      where id = ${id} returning *`;
    if (!row) throw new HttpError(404, 'Topilmadi');
    return { promo: row };
  }
  const [row] = await sql`insert into promos (kind, image, title, subtitle, product_id, category_id, is_active, sort)
    values (${b.kind}, ${x.image}, ${x.title}, ${x.subtitle}, ${x.product_id}, ${x.category_id}, ${x.is_active},
            (select coalesce(max(sort) + 1, 0) from promos where kind = ${b.kind}))
    returning *`;
  return { promo: row };
}

async function promoDelete(req, b) {
  await db()`delete from promos where id = ${toInt(b.id)}`;
  return { ok: true };
}

// ids tartibida sort = 1, 2, 3...
async function promoSort(req, b) {
  const ids = (Array.isArray(b.ids) ? b.ids : []).map((v) => toInt(v)).filter(Boolean).slice(0, 200);
  if (!ids.length) return { ok: true };
  await db()`update promos p set sort = x.ord
    from unnest(${ids}::int[]) with ordinality as x(id, ord) where p.id = x.id`;
  return { ok: true };
}

// ---------- customers
async function customers() {
  const sql = db();
  const [rows, s] = await Promise.all([
    sql`select u.*, count(o.id)::int as orders,
          coalesce(sum(o.total) filter (where o.status in ('paid','shipping','delivered')), 0)::bigint as spent
        from users u left join orders o on o.tg_id = u.tg_id
        group by u.tg_id order by u.last_seen desc nulls last limit 500`,
    getSettings(),
  ]);
  return { customers: rows, admin_chat_ids: (s.admin_chat_ids || []).map(String) };
}

async function adminChat(req, b) {
  const id = String(b.chat_id || '').trim();
  if (!/^-?\d{4,20}$/.test(id)) throw new HttpError(400, "Chat ID noto'g'ri");
  const s = await getSettings();
  const set = new Set((s.admin_chat_ids || []).map(String));
  if (b.on) set.add(id); else set.delete(id);
  await saveSetting('admin_chat_ids', [...set]);
  if (b.on) {
    await tg('sendMessage', { chat_id: id, text: "✅ Siz ISTANBUL BRAND admin bildirishnomalariga ulandingiz. Yangi buyurtmalar shu yerga keladi." });
  }
  return { admin_chat_ids: [...set] };
}

// ---------- settings
async function settings() {
  return { settings: await getSettings() };
}

async function settingsSave(req, b) {
  const s = b.settings || {};
  const out = {};
  const str = (k, max = 200) => { if (k in s) out[k] = clean(s[k], max); };
  str('shop_name', 60); str('tagline', 120); str('address', 200); str('working_hours', 60);
  str('card_holder', 60); str('card_type', 20); str('delivery_note', 200);
  if ('instagram' in s) out.instagram = clean(s.instagram, 60).replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '');
  if ('telegram_contact' in s) out.telegram_contact = clean(s.telegram_contact, 60).replace(/^@/, '');
  if ('card_number' in s) {
    const d = String(s.card_number || '').replace(/\D/g, '');
    if (d && (d.length < 16 || d.length > 19)) throw new HttpError(400, "Karta raqami 16 xonali bo'lishi kerak");
    out.card_number = d.replace(/(\d{4})(?=\d)/g, '$1 ');
  }
  if ('phones' in s) {
    const arr = Array.isArray(s.phones) ? s.phones : String(s.phones || '').split(/[\n,]+/);
    out.phones = arr.map((p) => clean(p, 30)).filter(Boolean).slice(0, 5);
  }
  if ('delivery_price' in s) out.delivery_price = Math.max(toInt(s.delivery_price, 0), 0);
  if ('free_delivery_from' in s) out.free_delivery_from = Math.max(toInt(s.free_delivery_from, 0), 0);
  if ('pickup_enabled' in s) out.pickup_enabled = !!s.pickup_enabled;
  if ('provider_token' in s) out.provider_token = clean(s.provider_token, 200);
  if ('admin_chat_ids' in s) {
    const arr = Array.isArray(s.admin_chat_ids) ? s.admin_chat_ids : String(s.admin_chat_ids || '').split(/[\s,]+/);
    out.admin_chat_ids = arr.map((x) => String(x).trim()).filter((x) => /^-?\d{4,20}$/.test(x));
  }
  for (const [k, v] of Object.entries(out)) {
    if (k in DEFAULT_SETTINGS) await saveSetting(k, v);
  }
  return { settings: await getSettings() };
}

// ---------- bot
async function botInfo() {
  const [me, wh] = await Promise.all([tg('getMe'), tg('getWebhookInfo')]);
  return { me: me.result || null, webhook: wh.result || null };
}

async function botSetupAction(req) {
  const base = hostUrl(req);
  const results = await setupBot(base);
  return { base, results };
}

async function botTest() {
  const s = await getSettings();
  if (!(s.admin_chat_ids || []).length) throw new HttpError(400, "Admin chat ulanmagan. Botga /admin PAROL yuboring.");
  await notifyAdmins("🔔 <b>Sinov xabari</b>\n\nAdmin bildirishnomalari to'g'ri ishlayapti.");
  return { ok: true };
}
