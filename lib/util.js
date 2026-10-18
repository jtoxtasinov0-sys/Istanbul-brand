export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Har bir API handler xatolarini bir xil formatda qaytaradi
export function handler(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (e) {
      if (!(e instanceof HttpError)) console.error(e);
      if (!res.headersSent) {
        res.status(e instanceof HttpError ? e.status : 500)
          .json({ error: e instanceof HttpError ? e.message : 'Server xatosi. Birozdan keyin qayta urinib ko\'ring.' });
      }
    }
  };
}

export async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {};
  if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString('utf8') || '{}');
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

export const fmtSum = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " so'm";

export const escHtml = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const clean = (s, max = 200) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export const cleanText = (s, max = 1000) => String(s ?? '').replace(/\r/g, '').trim().slice(0, max);

export function toInt(v, def = null) {
  const n = parseInt(String(v ?? '').replace(/\s/g, ''), 10);
  return Number.isFinite(n) ? n : def;
}

// +998 XX XXX XX XX formatiga keltiradi, noto'g'ri bo'lsa null
export function normPhone(p) {
  let d = String(p || '').replace(/\D/g, '');
  if (d.length === 9) d = '998' + d;
  if (d.length !== 12 || !d.startsWith('998')) return null;
  return `+998 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`;
}

const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// base64 rasmni tekshirib Buffer qaytaradi
export function decodeImage(img, maxBytes = 3_500_000) {
  if (!img || typeof img.data !== 'string') return null;
  const mime = String(img.mime || 'image/jpeg').toLowerCase();
  if (!IMAGE_MIMES.has(mime)) throw new HttpError(400, 'Rasm formati JPG, PNG yoki WEBP bo\'lishi kerak');
  const data = img.data.replace(/^data:[^,]+,/, '');
  const buf = Buffer.from(data, 'base64');
  if (!buf.length) throw new HttpError(400, 'Rasm bo\'sh');
  if (buf.length > maxBytes) throw new HttpError(413, 'Rasm hajmi juda katta');
  return { buf, mime, b64: buf.toString('base64') };
}

export function hostUrl(req) {
  if (process.env.WEBAPP_URL) return process.env.WEBAPP_URL.replace(/\/+$/, '');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || (String(host).startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
