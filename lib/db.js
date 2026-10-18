import { neon } from '@neondatabase/serverless';

let _sql;

export function db() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL o'rnatilmagan");
    _sql = neon(url);
  }
  return _sql;
}

// Sozlamalar standart qiymatlari (bazada yo'q bo'lsa shular ishlatiladi)
export const DEFAULT_SETTINGS = {
  shop_name: 'ISTANBUL BRAND',
  tagline: "Premium erkaklar kiyimlari",
  phones: ['+998 50 760 00 10', '+998 88 855 71 11'],
  address: "Andijon vil., Shahrixon tumani, Rashmilk bozori",
  instagram: 'istanbul_braand',
  telegram_contact: '',
  working_hours: '09:00 – 20:00',
  card_number: '',
  card_holder: '',
  card_type: 'Uzcard',
  delivery_price: 0,
  free_delivery_from: 0,
  delivery_note: "O'zbekiston bo'ylab 1–3 kun ichida yetkazib beramiz",
  pickup_enabled: true,
  provider_token: '',
  admin_chat_ids: [],
  webapp_url: '',
};

// Mini App'ga ochiq ko'rsatiladigan sozlamalar
const PUBLIC_KEYS = [
  'shop_name', 'tagline', 'phones', 'address', 'instagram', 'telegram_contact', 'working_hours',
  'card_number', 'card_holder', 'card_type', 'delivery_price', 'free_delivery_from', 'delivery_note', 'pickup_enabled',
];

export async function getSettings() {
  const rows = await db()`select key, value from settings`;
  const s = { ...DEFAULT_SETTINGS };
  for (const r of rows) s[r.key] = r.value;
  return s;
}

export function publicSettings(s) {
  const out = {};
  for (const k of PUBLIC_KEYS) out[k] = s[k];
  out.online_payment = !!s.provider_token;
  return out;
}

export async function saveSetting(key, value) {
  await db()`insert into settings (key, value) values (${key}, ${JSON.stringify(value)}::jsonb)
             on conflict (key) do update set value = excluded.value`;
}

export async function adminChatIds() {
  const s = await getSettings();
  const env = String(process.env.ADMIN_CHAT_IDS || '').split(/[\s,]+/).filter(Boolean);
  return [...new Set([...(s.admin_chat_ids || []), ...env].map(String))];
}

export async function upsertUser(u, extra = {}) {
  if (!u || !u.id) return;
  await db()`insert into users (tg_id, first_name, last_name, username, lang, phone, photo_url)
    values (${u.id}, ${u.first_name || null}, ${u.last_name || null}, ${u.username || null},
            ${extra.lang || u.language_code || null}, ${extra.phone || null}, ${u.photo_url || null})
    on conflict (tg_id) do update set
      first_name = excluded.first_name, last_name = excluded.last_name, username = excluded.username,
      lang = coalesce(${extra.lang || null}, users.lang),
      phone = coalesce(excluded.phone, users.phone),
      photo_url = coalesce(excluded.photo_url, users.photo_url),
      last_seen = now()`;
}
