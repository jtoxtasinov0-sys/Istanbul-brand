import { db, getSettings, publicSettings } from '../lib/db.js';
import { handler } from '../lib/util.js';

// Mini App uchun katalog: sozlamalar, kategoriyalar va faol mahsulotlar
export default handler(async (req, res) => {
  const sql = db();
  const [settings, categories, products] = await Promise.all([
    getSettings(),
    sql`select id, slug, name, name_ru, image, sort from categories where is_active order by sort, id`,
    sql`select id, category_id, name, brand, badge, color, description, sizes, price, old_price, images,
               in_stock, is_new, is_featured, sold_count, sort
        from products where is_active order by sort, id`,
  ]);
  // Brauzer har safar yangisini so'raydi; Vercel CDN 10 soniya keshlaydi
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Vercel-CDN-Cache-Control', 'max-age=10, stale-while-revalidate=60');
  res.status(200).json({ settings: publicSettings(settings), categories, products });
});
