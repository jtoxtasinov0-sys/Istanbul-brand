# ISTANBUL BRAND — Telegram do'kon

Turkiyadan keltirilgan premium erkaklar kiyimlari uchun Telegram Mini App, admin panel va bot.

- **Mini App** (`/`) — katalog, qidiruv, o'lcham tanlash, sevimlilar, savat, buyurtma va buyurtma holati. O'zbek va rus tillarida.
- **To'lov — faqat bank kartasi orqali:**
  - *Kartaga o'tkazma* — mijoz do'kon kartasiga pul o'tkazadi va chek (skrinshot) yuklaydi, admin tasdiqlaydi.
  - *Onlayn to'lov* (ixtiyoriy) — Click/Payme provider tokeni kiritilsa, Telegram ichida karta bilan to'lanadi.
- **Admin panel** (`/admin`) — boshqaruv paneli, buyurtmalar (chekni ko'rish, tasdiqlash/rad etish), mahsulotlar, kategoriyalar, mijozlar, sozlamalar.
- **Bot** — do'konni ochish tugmasi, buyurtma holati xabarlari, adminlarga yangi buyurtma + chek va tasdiqlash tugmalari.

Texnologiyalar: Vercel serverless funksiyalar (Node.js), Neon PostgreSQL, toza HTML/CSS/JS (build kerak emas).

## Vercel'ga joylash

1. Vercel'da loyihani GitHub'dan import qiling (Framework: **Other**).
2. **Environment Variables** bo'limiga qo'shing:

   | Nomi | Qiymat |
   |---|---|
   | `DATABASE_URL` | Neon ulanish manzili |
   | `BOT_TOKEN` | @BotFather bergan token |
   | `ADMIN_PASSWORD` | Admin panel paroli |

3. Deploy qiling, so'ng `https://SAYT/admin` ga kiring → **Sozlamalar → Telegram bot → Ulash**.
4. Sozlamalarda **karta raqamini** kiriting.
5. Telegram'da botga `/admin PAROL` yozing — yangi buyurtmalar shu chatga keladi.

## Lokal ishga tushirish

```bash
npm install
cp .env.example .env   # qiymatlarni to'ldiring
npm run db:setup       # jadvallar + 45 ta boshlang'ich mahsulot
npm run dev            # http://localhost:3000
```

## Tuzilma

```
api/        catalog · order · img · bot · admin   (Vercel funksiyalari)
lib/        db, auth (initData tekshiruvi), orders, telegram
public/     index.html + app.js/css (Mini App), admin.html + admin.js/css
scripts/    setup-db, setup-bot, dev server, seed-data.json
```

## Buyurtma holatlari

`checking` (to'lov tekshirilmoqda) → `paid` (to'landi) → `shipping` (yo'lda) → `delivered` (yetkazildi).
Yon holatlar: `rejected` (to'lov rad etildi), `cancelled` (bekor qilindi), `awaiting_payment` (onlayn to'lov kutilmoqda).
Har bir o'zgarishda mijozga Telegram orqali xabar boradi.
