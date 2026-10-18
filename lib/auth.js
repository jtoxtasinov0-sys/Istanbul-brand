import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const sha = (s) => createHash('sha256').update(String(s)).digest();

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

// Parol yoki bot token o'zgarsa, eski tokenlar avtomatik bekor bo'ladi
const secret = () => process.env.ADMIN_SECRET
  || createHash('sha256').update(`${process.env.ADMIN_PASSWORD}|${process.env.BOT_TOKEN}|ib-admin`).digest('hex');

export function passwordOk(pw) {
  if (!process.env.ADMIN_PASSWORD) return false;
  return timingSafeEqual(sha(pw ?? ''), sha(process.env.ADMIN_PASSWORD));
}

export function signAdminToken(days = 14) {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + days * 864e5 })).toString('base64url');
  const sig = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function isAdmin(req) {
  const h = String(req.headers.authorization || '');
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = createHmac('sha256', secret()).update(payload).digest('base64url');
  if (!safeEqual(expected, sig)) return false;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now();
  } catch {
    return false;
  }
}

// Telegram Mini App initData imzosini tekshiradi; to'g'ri bo'lsa user obyektini qaytaradi
export function verifyInitData(initData, maxAgeSec = 7 * 86400) {
  const token = process.env.BOT_TOKEN;
  if (!initData || !token) return null;
  const params = new URLSearchParams(String(initData));
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');
  const dataCheck = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const key = createHmac('sha256', 'WebAppData').update(token).digest();
  const calc = createHmac('sha256', key).update(dataCheck).digest('hex');
  if (!safeEqual(calc, hash)) return null;
  const authDate = Number(params.get('auth_date') || 0);
  if (maxAgeSec && Date.now() / 1000 - authDate > maxAgeSec) return null;
  try {
    return JSON.parse(params.get('user') || 'null');
  } catch {
    return null;
  }
}

export function webhookSecret() {
  return createHash('sha256').update(`ib-webhook|${process.env.BOT_TOKEN}`).digest('hex').slice(0, 48);
}
