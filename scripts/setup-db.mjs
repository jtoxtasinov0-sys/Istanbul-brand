// Jadvallarni yaratadi va bo'sh bazaga boshlang'ich mahsulotlarni yuklaydi.
// Ishga tushirish: npm run db:setup
import { root } from './env.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const schema = [
  `create table if not exists settings (
     key text primary key,
     value jsonb not null
   )`,
  `create table if not exists categories (
     id serial primary key,
     slug text unique not null,
     name text not null,
     name_ru text,
     image text,
     sort int not null default 0,
     is_active boolean not null default true,
     created_at timestamptz not null default now()
   )`,
  `create table if not exists products (
     id serial primary key,
     category_id int references categories(id) on delete set null,
     name text not null,
     brand text,
     badge text,
     color text,
     description text,
     sizes text[] not null default '{}',
     price int not null default 0,
     old_price int,
     images text[] not null default '{}',
     is_active boolean not null default true,
     in_stock boolean not null default true,
     is_new boolean not null default false,
     is_featured boolean not null default false,
     sold_count int not null default 0,
     sort int not null default 0,
     created_at timestamptz not null default now(),
     updated_at timestamptz not null default now()
   )`,
  `create index if not exists products_category_idx on products(category_id)`,
  `create table if not exists images (
     id serial primary key,
     kind text not null default 'product',
     mime text not null,
     data bytea not null,
     created_at timestamptz not null default now()
   )`,
  `create table if not exists users (
     tg_id bigint primary key,
     first_name text,
     last_name text,
     username text,
     phone text,
     lang text,
     photo_url text,
     created_at timestamptz not null default now(),
     last_seen timestamptz not null default now()
   )`,
  `create table if not exists orders (
     id serial primary key,
     tg_id bigint,
     username text,
     customer_name text not null,
     phone text not null,
     delivery_type text not null default 'delivery',
     region text,
     address text,
     comment text,
     items jsonb not null,
     subtotal int not null,
     delivery_price int not null default 0,
     total int not null,
     payment_method text not null default 'card',
     receipt_id int references images(id) on delete set null,
     status text not null default 'checking',
     admin_note text,
     payment_charge_id text,
     created_at timestamptz not null default now(),
     updated_at timestamptz not null default now(),
     paid_at timestamptz
   )`,
  `create index if not exists orders_tg_idx on orders(tg_id)`,
  `create index if not exists orders_status_idx on orders(status)`,
];

for (const q of schema) await sql.query(q);

// Buyurtma raqamlari #1001 dan boshlansin
const [{ n: orderCount }] = await sql`select count(*)::int as n from orders`;
if (orderCount === 0) await sql`select setval('orders_id_seq', 1000, true)`;
console.log('✓ Jadvallar tayyor');

const seed = JSON.parse(readFileSync(join(root, 'scripts', 'seed-data.json'), 'utf8'));

const [{ n: catCount }] = await sql`select count(*)::int as n from categories`;
if (catCount === 0) {
  for (const c of seed.categories) {
    await sql`insert into categories (slug, name, name_ru, sort) values (${c.slug}, ${c.name}, ${c.name_ru}, ${c.sort})`;
  }
  console.log(`✓ ${seed.categories.length} ta kategoriya qo'shildi`);
} else {
  console.log(`• Kategoriyalar allaqachon bor (${catCount}) — o'tkazib yuborildi`);
}

const [{ n: prodCount }] = await sql`select count(*)::int as n from products`;
if (prodCount === 0) {
  const cats = await sql`select id, slug from categories`;
  const catId = Object.fromEntries(cats.map((c) => [c.slug, c.id]));
  for (const p of seed.products) {
    await sql`insert into products (category_id, name, brand, badge, color, sizes, price, images, is_new, is_featured, sort)
      values (${catId[p.category] ?? null}, ${p.name}, ${p.brand}, ${p.badge}, ${p.color}, ${p.sizes}, ${p.price},
              ${[p.image]}, ${p.is_new}, ${p.is_featured}, ${p.no})`;
  }
  console.log(`✓ ${seed.products.length} ta mahsulot qo'shildi`);
} else {
  console.log(`• Mahsulotlar allaqachon bor (${prodCount}) — o'tkazib yuborildi`);
}

console.log('Tayyor.');
