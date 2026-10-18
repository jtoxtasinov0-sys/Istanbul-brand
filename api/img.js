import { db } from '../lib/db.js';
import { handler, toInt } from '../lib/util.js';

// Admin paneldan yuklangan mahsulot/kategoriya rasmlari (cheklar bu yerdan berilmaydi)
export default handler(async (req, res) => {
  const id = toInt(req.query.id);
  if (!id) return res.status(400).send('id kerak');
  const [row] = await db()`select mime, encode(data, 'base64') as b64 from images where id = ${id} and kind = 'product'`;
  if (!row) return res.status(404).send('Topilmadi');
  res.setHeader('Content-Type', row.mime);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.status(200).send(Buffer.from(row.b64, 'base64'));
});
