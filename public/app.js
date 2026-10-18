/* ISTANBUL BRAND — Telegram Mini App */
(() => {
'use strict';

const tg = window.Telegram && window.Telegram.WebApp;
const inTg = !!(tg && tg.initData);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const norm = (s) => String(s || '').toLowerCase().replace(/[ʻʼ'`’‘]/g, '').replace(/\s+/g, ' ').trim();
const store = {
  get(k, d) { try { const v = localStorage.getItem('ib_' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('ib_' + k, JSON.stringify(v)); } catch {} },
};

/* ---------------- i18n ---------------- */
const T = {
  uz: {
    greet_morning: 'Xayrli tong,', greet_day: 'Xayrli kun,', greet_evening: 'Xayrli kech,', greet_night: 'Xayrli tun,',
    guest: 'Mehmon', subtitle: 'bugun nima tanlaymiz?', search_ph: 'Mahsulot yoki brend nomi...',
    categories: 'Kategoriyalar', all: 'Hammasi', popular: 'Ommabop', fresh: 'Yangi kelganlar',
    view: "Ko'rish", discount: 'Chegirma', new_collection: 'Yangi kolleksiya 2026',
    nav_home: 'Asosiy', nav_catalog: 'Katalog', nav_favs: 'Sevimli', nav_profile: 'Profil',
    sum: "so'm", n_products: '{n} ta mahsulot',
    perk_quality: 'Turkiya sifati', perk_delivery: "O'zbekiston bo'ylab yetkazish", perk_card: "Karta orqali to'lov",
    contact: 'Biz bilan aloqa', address: 'Manzil', phone: 'Telefon', hours: 'Ish vaqti', instagram: 'Instagram', telegram: 'Telegram',
    catalog: 'Katalog', sort: 'Saralash', sort_pop: 'Ommabop', sort_new: 'Yangilari', sort_cheap: 'Arzonroq', sort_exp: 'Qimmatroq',
    nothing: 'Hech narsa topilmadi', nothing_sub: "Boshqa so'z bilan qidirib ko'ring yoki kategoriyani almashtiring",
    add_to_cart: "Savatga qo'shish", added: "Savatga qo'shildi", to_cart: "Savatga o'tish", choose_size: "O'lchamni tanlang",
    size: "O'lcham", color: 'Rang', qty: 'Soni', oos: "Sotuvda yo'q", description: 'Tavsif', similar: "O'xshash mahsulotlar",
    price: 'Narxi', total_price: 'Jami',
    pd_perk1: "Turkiyadan keltirilgan original sifat", pd_perk2: "O'zbekiston bo'ylab yetkazib berish", pd_perk3: "Bank kartasi orqali xavfsiz to'lov",
    cart: 'Savat', cart_empty: "Savatingiz bo'sh", cart_empty_sub: "Katalogdan o'zingizga yoqqan mahsulotni tanlang",
    go_catalog: "Katalogga o'tish", items_sum: 'Mahsulotlar', delivery: 'Yetkazib berish', free: 'Bepul', total: 'Jami',
    checkout: 'Rasmiylashtirish', pcs: 'dona',
    co_title: 'Rasmiylashtirish', your_info: "Ma'lumotlaringiz", f_name: 'Ism va familiya', f_name_ph: 'Masalan: Abdurahmon Toxtasinov',
    f_phone: 'Telefon raqam', share_phone: 'Telegram raqamini yuborish', receive: 'Qabul qilish usuli',
    deliv_courier: 'Yetkazib berish', deliv_courier_sub: "O'zbekiston bo'ylab", deliv_pickup: 'Olib ketish', deliv_pickup_sub: "Do'kondan o'zingiz",
    f_region: 'Viloyat', f_region_ph: 'Viloyatni tanlang', f_address: 'Manzil', f_address_ph: "Shahar/tuman, ko'cha, uy, mo'ljal",
    f_comment: 'Izoh (ixtiyoriy)', f_comment_ph: "Masalan: qo'ng'iroq qilib keling",
    pickup_at: 'Olib ketish manzili', payment: "To'lov", pay_card: "Kartaga o'tkazma", pay_card_sub: 'Chek (skrinshot) yuborasiz',
    pay_online: "Onlayn to'lov", pay_online_sub: 'Click / Payme orqali karta bilan',
    copy_card: 'Karta raqami', copy_sum: 'Summa', copied: 'Nusxa olindi',
    step1: '<b>{sum}</b> summani yuqoridagi kartaga o\'tkazing', step2: "To'lov chekini (skrinshot) shu yerga yuklang",
    step3: "Buyurtmani tasdiqlang — admin to'lovni tekshirib, Telegram orqali xabar beradi",
    upload: "To'lov chekini yuklang", upload_sub: 'Skrinshot yoki rasm (JPG, PNG)', upload_done: 'Chek yuklandi', upload_change: 'Almashtirish uchun bosing',
    online_note: "To'lov oynasi Telegram ichida ochiladi. Uzcard, Humo va Visa kartalari qabul qilinadi.",
    card_missing: "Hozircha karta raqami kiritilmagan. Buyurtma uchun do'kon bilan bog'laning.",
    confirm: 'Buyurtmani tasdiqlash', confirm_short: 'Tasdiqlash', delivery_note_free: 'Yetkazib berish bepul',
    err_name: 'Ism va familiyani kiriting', err_phone: "Telefon raqamni to'liq kiriting", err_region: 'Viloyatni tanlang',
    err_address: "Manzilni to'liq kiriting", err_receipt: "To'lov chekini yuklang", err_network: 'Tarmoq xatosi. Qayta urinib ko\'ring',
    err_img: "Rasmni o'qib bo'lmadi. Boshqa rasm tanlang", pay_not_done: "To'lov yakunlanmadi. Buyurtmalarim bo'limidan qayta urinib ko'ring",
    success: 'Buyurtma qabul qilindi!', success_card: "To'lovingiz tekshirilgach, sizga Telegram orqali xabar beramiz. Odatda bu 5–30 daqiqa oladi.",
    success_paid: "To'lov muvaffaqiyatli! Buyurtmangizni tez orada tayyorlaymiz.", my_orders: 'Buyurtmalarim', home: 'Bosh sahifa',
    order: 'Buyurtma', no_orders: "Hali buyurtmalar yo'q", no_orders_sub: 'Birinchi xaridingizni hoziroq qiling',
    open_in_tg: 'Buyurtmalarni ko\'rish uchun do\'konni Telegram bot orqali oching', items: 'Mahsulotlar', receiving: 'Qabul qilish',
    pay_method: "To'lov usuli", order_note: 'Admin izohi',
    tl_created: 'Buyurtma qabul qilindi', tl_checked: "To'lov tasdiqlandi", tl_shipping: "Yo'lga chiqdi", tl_ready: 'Olib ketishga tayyor', tl_delivered: 'Yetkazildi',
    favs: 'Sevimlilar', favs_empty: "Sevimlilar ro'yxati bo'sh", favs_empty_sub: 'Mahsulotdagi ♡ belgisini bosib, shu yerga saqlang',
    profile: 'Profil', language: 'Til', store: "Do'kon", footer: 'Premium erkaklar kiyimlari',
    load_err: "Ma'lumotlarni yuklab bo'lmadi", retry: 'Qayta urinish', not_found: 'Mahsulot topilmadi', back: 'Orqaga',
    st_awaiting_payment: "To'lov kutilmoqda", st_checking: "To'lov tekshirilmoqda", st_paid: "To'landi", st_shipping: "Yo'lda",
    st_delivered: 'Yetkazildi', st_rejected: "To'lov rad etildi", st_cancelled: 'Bekor qilindi', st_ready: 'Tayyor',
    pay_again: "Qayta to'lash", contact_us: "Bog'lanish",
  },
  ru: {
    greet_morning: 'Доброе утро,', greet_day: 'Добрый день,', greet_evening: 'Добрый вечер,', greet_night: 'Доброй ночи,',
    guest: 'Гость', subtitle: 'что выберем сегодня?', search_ph: 'Название товара или бренда...',
    categories: 'Категории', all: 'Все', popular: 'Популярное', fresh: 'Новинки',
    view: 'Смотреть', discount: 'Скидка', new_collection: 'Новая коллекция 2026',
    nav_home: 'Главная', nav_catalog: 'Каталог', nav_favs: 'Избранное', nav_profile: 'Профиль',
    sum: 'сум', n_products: '{n} товаров',
    perk_quality: 'Качество Турции', perk_delivery: 'Доставка по Узбекистану', perk_card: 'Оплата картой',
    contact: 'Контакты', address: 'Адрес', phone: 'Телефон', hours: 'Время работы', instagram: 'Instagram', telegram: 'Telegram',
    catalog: 'Каталог', sort: 'Сортировка', sort_pop: 'Популярные', sort_new: 'Новые', sort_cheap: 'Дешевле', sort_exp: 'Дороже',
    nothing: 'Ничего не найдено', nothing_sub: 'Попробуйте другой запрос или категорию',
    add_to_cart: 'В корзину', added: 'Добавлено в корзину', to_cart: 'В корзину', choose_size: 'Выберите размер',
    size: 'Размер', color: 'Цвет', qty: 'Количество', oos: 'Нет в наличии', description: 'Описание', similar: 'Похожие товары',
    price: 'Цена', total_price: 'Итого',
    pd_perk1: 'Оригинальное качество из Турции', pd_perk2: 'Доставка по всему Узбекистану', pd_perk3: 'Безопасная оплата банковской картой',
    cart: 'Корзина', cart_empty: 'Корзина пуста', cart_empty_sub: 'Выберите понравившийся товар в каталоге',
    go_catalog: 'Перейти в каталог', items_sum: 'Товары', delivery: 'Доставка', free: 'Бесплатно', total: 'Итого',
    checkout: 'Оформить заказ', pcs: 'шт.',
    co_title: 'Оформление', your_info: 'Ваши данные', f_name: 'Имя и фамилия', f_name_ph: 'Например: Абдурахмон Тохтасинов',
    f_phone: 'Номер телефона', share_phone: 'Отправить номер из Telegram', receive: 'Способ получения',
    deliv_courier: 'Доставка', deliv_courier_sub: 'По Узбекистану', deliv_pickup: 'Самовывоз', deliv_pickup_sub: 'Из магазина',
    f_region: 'Область', f_region_ph: 'Выберите область', f_address: 'Адрес', f_address_ph: 'Город/район, улица, дом, ориентир',
    f_comment: 'Комментарий (необязательно)', f_comment_ph: 'Например: позвоните заранее',
    pickup_at: 'Адрес самовывоза', payment: 'Оплата', pay_card: 'Перевод на карту', pay_card_sub: 'Отправите чек (скриншот)',
    pay_online: 'Онлайн-оплата', pay_online_sub: 'Картой через Click / Payme',
    copy_card: 'Номер карты', copy_sum: 'Сумма', copied: 'Скопировано',
    step1: 'Переведите <b>{sum}</b> на карту выше', step2: 'Загрузите чек оплаты (скриншот)',
    step3: 'Подтвердите заказ — администратор проверит оплату и сообщит в Telegram',
    upload: 'Загрузите чек оплаты', upload_sub: 'Скриншот или фото (JPG, PNG)', upload_done: 'Чек загружен', upload_change: 'Нажмите, чтобы заменить',
    online_note: 'Окно оплаты откроется в Telegram. Принимаются карты Uzcard, Humo и Visa.',
    card_missing: 'Номер карты пока не указан. Для заказа свяжитесь с магазином.',
    confirm: 'Подтвердить заказ', confirm_short: 'Подтвердить', delivery_note_free: 'Доставка бесплатная',
    err_name: 'Введите имя и фамилию', err_phone: 'Введите номер телефона полностью', err_region: 'Выберите область',
    err_address: 'Введите полный адрес', err_receipt: 'Загрузите чек оплаты', err_network: 'Ошибка сети. Попробуйте ещё раз',
    err_img: 'Не удалось прочитать изображение', pay_not_done: 'Оплата не завершена. Попробуйте снова в разделе «Мои заказы»',
    success: 'Заказ принят!', success_card: 'После проверки оплаты мы сообщим вам в Telegram. Обычно это занимает 5–30 минут.',
    success_paid: 'Оплата прошла успешно! Скоро подготовим ваш заказ.', my_orders: 'Мои заказы', home: 'На главную',
    order: 'Заказ', no_orders: 'Заказов пока нет', no_orders_sub: 'Сделайте первую покупку прямо сейчас',
    open_in_tg: 'Чтобы увидеть заказы, откройте магазин через Telegram-бота', items: 'Товары', receiving: 'Получение',
    pay_method: 'Способ оплаты', order_note: 'Комментарий администратора',
    tl_created: 'Заказ принят', tl_checked: 'Оплата подтверждена', tl_shipping: 'Отправлен', tl_ready: 'Готов к выдаче', tl_delivered: 'Доставлен',
    favs: 'Избранное', favs_empty: 'В избранном пусто', favs_empty_sub: 'Нажмите ♡ на товаре, чтобы сохранить его здесь',
    profile: 'Профиль', language: 'Язык', store: 'Магазин', footer: 'Премиальная мужская одежда',
    load_err: 'Не удалось загрузить данные', retry: 'Повторить', not_found: 'Товар не найден', back: 'Назад',
    st_awaiting_payment: 'Ожидает оплаты', st_checking: 'Оплата проверяется', st_paid: 'Оплачен', st_shipping: 'В пути',
    st_delivered: 'Доставлен', st_rejected: 'Оплата отклонена', st_cancelled: 'Отменён', st_ready: 'Готов',
    pay_again: 'Оплатить снова', contact_us: 'Связаться',
  },
};
const userLang = tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.language_code;
let lang = store.get('lang', userLang === 'ru' ? 'ru' : 'uz');
const t = (k, v) => {
  let s = (T[lang] && T[lang][k]) ?? T.uz[k] ?? k;
  if (v) for (const [a, b] of Object.entries(v)) s = s.split(`{${a}}`).join(b);
  return s;
};
const money = (n) => `${fmt(n)} ${t('sum')}`;

const REGIONS = [
  'Toshkent shahri', 'Toshkent viloyati', 'Andijon viloyati', "Farg'ona viloyati", 'Namangan viloyati',
  'Samarqand viloyati', 'Buxoro viloyati', 'Navoiy viloyati', 'Qashqadaryo viloyati', 'Surxondaryo viloyati',
  'Jizzax viloyati', 'Sirdaryo viloyati', 'Xorazm viloyati', "Qoraqalpog'iston Respublikasi",
];

/* ---------------- icons ---------------- */
const I = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  heart: '<path d="M12 20.2s-7.6-4.6-9.2-9.4A4.9 4.9 0 0 1 12 6.6a4.9 4.9 0 0 1 9.2 4.2c-1.6 4.8-9.2 9.4-9.2 9.4z"/>',
  bag: '<path d="M5.5 8h13l-1.1 11.2a1.5 1.5 0 0 1-1.5 1.3H8.1a1.5 1.5 0 0 1-1.5-1.3z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"/>',
  phone: '<path d="M5 4h3.5l1.8 4.6-2.3 1.5a11 11 0 0 0 5.9 5.9l1.5-2.3L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z"/>',
  pin: '<path d="M12 21s-6.5-5.8-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.2-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  insta: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="3.8"/><circle cx="17.2" cy="6.8" r=".6" fill="currentColor"/>',
  send: '<path d="M21 3 3 10.5l7 2.5 2.5 7z"/><path d="m21 3-11 10"/>',
  truck: '<path d="M3 6.5h11v9H3zM14 9.5h3.8l3.2 3.4v2.6h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>',
  shield: '<path d="M12 3 5 6v5.5c0 4.4 3 8.2 7 9.5 4-1.3 7-5.1 7-9.5V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  box: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
  store: '<path d="M4 9.5 5.5 4h13L20 9.5M4 9.5V20h16V9.5M4 9.5c0 1.4 1.1 2.5 2.7 2.5S9.3 10.9 9.3 9.5c0 1.4 1.2 2.5 2.7 2.5s2.7-1.1 2.7-2.5c0 1.4 1.1 2.5 2.6 2.5S20 10.9 20 9.5"/><path d="M10 20v-4.5h4V20"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.6 3.5 5.4 3.5 8.5s-1.1 5.9-3.5 8.5c-2.4-2.6-3.5-5.4-3.5-8.5s1.1-5.9 3.5-8.5z"/>',
  sort: '<path d="M7 4v16M3.5 16.5 7 20l3.5-3.5M17 20V4M13.5 7.5 17 4l3.5 3.5"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
  alert: '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17h.01"/>',
  spark: '<path d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12C11.4 17.8 6.2 12.6 0 12 6.2 11.4 11.4 6.2 12 0z"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
  user: '<circle cx="12" cy="8.2" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
};
const ic = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true">${I[n] || ''}</svg>`;

/* ---------------- state ---------------- */
let D = store.get('catalog', null);
let byId = new Map();
let cart = store.get('cart', []);
let favs = new Set(store.get('favs', []));
let co = Object.assign({ name: '', phone: '', delivery: 'delivery', region: '', address: '', comment: '', payment: 'card' }, store.get('co', {}));
let receipt = null;
let myOrders = null;
let ordersErr = null;
let pd = { id: null, size: null, qty: 1 };
let sheetSel = null;
let cat = { c: 'all', q: '', s: 'pop' };
let timers = [];
let busy = false;
let homeStories = [];
let seenStories = new Set(store.get('seen', []));
let sv = null;

const user = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
if (user && !co.name) co.name = [user.first_name, user.last_name].filter(Boolean).join(' ');

function indexData() {
  byId = new Map(((D && D.products) || []).map((p) => [p.id, p]));
  if (D) {
    const before = cart.length;
    cart = cart.filter((i) => byId.has(i.id));
    if (before !== cart.length) saveCart();
  }
}

const saveCart = () => store.set('cart', cart);
const saveFavs = () => store.set('favs', [...favs]);
const saveCo = () => store.set('co', { ...co });
indexData();
const catById = (id) => (D.categories || []).find((c) => c.id === id);
const catName = (c) => (c ? (lang === 'ru' && c.name_ru ? c.name_ru : c.name) : '');
const cartCount = () => cart.reduce((a, i) => a + i.qty, 0);
const cartSubtotal = () => cart.reduce((a, i) => a + (byId.get(i.id)?.price || 0) * i.qty, 0);
const pImg = (p) => (p && p.images && p.images[0]) || '/img/logo-mark.png';
const catImg = (c) => c.image || pImg(D.products.find((p) => p.category_id === c.id));
const pct = (p) => (p.old_price && p.old_price > p.price ? Math.round((1 - p.price / p.old_price) * 100) : 0);

function deliveryFee(type = co.delivery, sub = cartSubtotal()) {
  const s = D.settings;
  if (type === 'pickup') return 0;
  if (s.free_delivery_from && sub >= s.free_delivery_from) return 0;
  return Number(s.delivery_price) || 0;
}

/* ---------------- helpers ---------------- */
const hap = {
  tap() { try { tg.HapticFeedback.selectionChanged(); } catch {} },
  hit(s = 'light') { try { tg.HapticFeedback.impactOccurred(s); } catch {} },
  note(s) { try { tg.HapticFeedback.notificationOccurred(s); } catch {} },
};

let toastT;
function toast(msg, kind = 'ok', link) {
  const el = $('#toast');
  el.className = `toast ${kind === 'err' ? 'err' : ''}`;
  el.innerHTML = `${ic(kind === 'err' ? 'alert' : 'check')}<span>${esc(msg)}</span>${link ? `<a href="${link.href}" style="margin-left:6px;text-decoration:underline">${esc(link.text)}</a>` : ''}`;
  el.hidden = false;
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  clearTimeout(toastT);
  toastT = setTimeout(() => { el.hidden = true; }, kind === 'err' ? 3800 : 2400);
}

function openLink(url) {
  if (/^https:\/\/t\.me\//.test(url) && tg && tg.openTelegramLink) return tg.openTelegramLink(url);
  if (tg && tg.openLink && inTg) return tg.openLink(url);
  window.open(url, '_blank', 'noopener');
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch {}
    ta.remove();
  }
  hap.note('success');
  toast(t('copied'));
}

function img(src, alt = '', eager = false) {
  return `<img src="${esc(src)}" alt="${esc(alt)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" onerror="this.onerror=null;this.src='/img/logo-mark.png'">`;
}

function fmtPhone(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (d.startsWith('998')) d = d.slice(3);
  d = d.slice(0, 9);
  let out = '+998';
  if (d.length) out += ' ' + d.slice(0, 2);
  if (d.length > 2) out += ' ' + d.slice(2, 5);
  if (d.length > 5) out += ' ' + d.slice(5, 7);
  if (d.length > 7) out += ' ' + d.slice(7, 9);
  return out;
}
const phoneOk = (v) => /^998\d{9}$/.test(String(v || '').replace(/\D/g, ''));

function fmtDate(s) {
  const d = new Date(s);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} · ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function greetKey() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return 'greet_morning';
  if (h >= 11 && h < 17) return 'greet_day';
  if (h >= 17 && h < 23) return 'greet_evening';
  return 'greet_night';
}

async function compressImage(file, max = 1400, q = 0.82) {
  const url = URL.createObjectURL(file);
  try {
    const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
    const w = Math.max(1, Math.round(im.naturalWidth * k));
    const h = Math.max(1, Math.round(im.naturalHeight * k));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    ctx.drawImage(im, 0, 0, w, h);
    const dataUrl = c.toDataURL('image/jpeg', q);
    return { data: dataUrl.split(',')[1], mime: 'image/jpeg', preview: dataUrl };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ---------------- components ---------------- */
function productCard(p) {
  const d = pct(p);
  const fav = favs.has(p.id);
  const tag = !p.in_stock ? `<span class="ptag oos">${t('oos')}</span>`
    : d ? `<span class="ptag sale">-${d}%</span>`
    : p.badge ? `<span class="ptag">${esc(p.badge)}</span>` : '';
  return `<article class="pcard">
    <div class="pmedia${p.in_stock ? '' : ' oos'}">
      <a href="#/p/${p.id}" aria-label="${esc(p.name)}">${img(pImg(p), p.name)}</a>
      ${tag}
      <button class="fav-btn${fav ? ' on' : ''}" data-fav="${p.id}" aria-label="${t('nav_favs')}" aria-pressed="${fav}">${ic('heart')}</button>
      <button class="add-btn" data-add="${p.id}" aria-label="${t('add_to_cart')}"${p.in_stock ? '' : ' disabled'}>${ic('plus')}</button>
    </div>
    <a class="pinfo" href="#/p/${p.id}">
      <span class="pbrand">${esc(p.brand || catName(catById(p.category_id)))}</span>
      <span class="pname">${esc(p.name)}</span>
      <span class="pprice"><b>${money(p.price)}</b>${p.old_price ? `<s>${fmt(p.old_price)}</s>` : ''}</span>
    </a>
  </article>`;
}

const secHead = (title, href) => `<div class="sec-head"><h2>${title}</h2>${href ? `<a class="pill-link" href="${href}">${t('all')} ${ic('arrow')}</a>` : ''}</div>`;

function emptyBlock(icon, title, sub, btn) {
  return `<div class="empty"><div class="ei">${ic(icon)}</div><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ''}${btn || ''}</div>`;
}

function statusChip(o) {
  const key = o.delivery_type === 'pickup' && o.status === 'shipping' ? 'st_ready' : `st_${o.status}`;
  return `<span class="st ${esc(o.status)}">${t(key)}</span>`;
}

function contactRows() {
  const s = D.settings;
  const rows = [];
  if (s.address) rows.push(`<div class="crow"><span class="ci">${ic('pin')}</span><div class="cx"><small>${t('address')}</small><strong>${esc(s.address)}</strong></div></div>`);
  for (const ph of s.phones || []) {
    rows.push(`<a class="crow" href="tel:${esc(ph.replace(/[^\d+]/g, ''))}"><span class="ci">${ic('phone')}</span><div class="cx"><small>${t('phone')}</small><strong class="num">${esc(ph)}</strong></div><span class="chev">${ic('chev')}</span></a>`);
  }
  if (s.working_hours) rows.push(`<div class="crow"><span class="ci">${ic('clock')}</span><div class="cx"><small>${t('hours')}</small><strong>${esc(s.working_hours)}</strong></div></div>`);
  if (s.instagram) rows.push(`<button class="crow" style="width:100%;text-align:left" data-link="https://instagram.com/${esc(s.instagram)}"><span class="ci">${ic('insta')}</span><div class="cx"><small>${t('instagram')}</small><strong>@${esc(s.instagram)}</strong></div><span class="chev">${ic('chev')}</span></button>`);
  if (s.telegram_contact) rows.push(`<button class="crow" style="width:100%;text-align:left" data-link="https://t.me/${esc(s.telegram_contact)}"><span class="ci">${ic('send')}</span><div class="cx"><small>${t('telegram')}</small><strong>@${esc(s.telegram_contact)}</strong></div><span class="chev">${ic('chev')}</span></button>`);
  return rows.join('');
}

/* ---------------- views ---------------- */
const views = {};
const mounts = {};

// Admin paneldan tanlangan storis/bannerlar: rasm galereyadan yoki mahsulotdan
function promoList(list) {
  return (list || []).map((x) => {
    const p = x.product_id ? byId.get(x.product_id) : null;
    const c = !p && x.category_id ? catById(x.category_id) : null;
    const image = x.image || (p && pImg(p));
    return image ? { ...x, key: `s${x.id}`, p, c, image } : null;
  }).filter(Boolean);
}
const storyLabel = (x) => x.title || (x.p && (x.p.brand || x.p.name)) || (x.c && catName(x.c)) || D.settings.shop_name;

views.home = () => {
  const P = D.products;
  const name = (user && user.first_name) || t('guest');
  const seen = new Set();
  const uniq = (arr) => arr.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
  // Admin hech narsa tanlamagan bo'lsa — avtomatik: yangi, bannerdagi va chegirmadagi mahsulotlar
  let stories = promoList(D.promos && D.promos.stories);
  if (!stories.length) {
    stories = uniq([...P.filter((p) => p.is_new), ...P.filter((p) => p.is_featured), ...P]).slice(0, 12)
      .map((p) => ({ key: `p${p.id}`, p, image: pImg(p) }));
  }
  homeStories = stories;
  let banners = promoList(D.promos && D.promos.banners);
  if (!banners.length) {
    let auto = P.filter((p) => p.old_price && p.old_price > p.price).concat(P.filter((p) => p.is_featured));
    auto = auto.filter((p, i) => auto.findIndex((x) => x.id === p.id) === i).slice(0, 6);
    if (!auto.length) auto = P.slice(0, 4);
    banners = auto.map((p) => ({ p, image: pImg(p) }));
  }

  // Ommabop: avval sotilganlar, keyin har kategoriyadan navbat bilan
  const rank = new Map();
  const perCat = {};
  for (const p of P) { perCat[p.category_id] = (perCat[p.category_id] || 0) + 1; rank.set(p.id, perCat[p.category_id]); }
  const popular = [...P].sort((a, b) => (b.sold_count - a.sold_count) || (rank.get(a.id) - rank.get(b.id)) || (a.sort - b.sort)).slice(0, 10);
  const fresh = [...P].sort((a, b) => (b.is_new - a.is_new) || (b.id - a.id)).slice(0, 6);
  const cats = D.categories.filter((c) => P.some((p) => p.category_id === c.id));

  return `
  <section class="hero">
    <span class="sparkle">${ic('spark')}</span>
    <div class="hero-top">
      <div style="min-width:0">
        <h1 class="greet">${t(greetKey())}<br><span class="gold-text">${esc(name)}</span></h1>
        <p class="hero-sub">${t('subtitle')}</p>
      </div>
      <div class="hero-actions">
        <button class="lang-btn" data-act="lang" aria-label="${t('language')}">${lang.toUpperCase()}</button>
        <span class="logo-round"><img src="/img/logo-mark.png" alt="ISTANBUL BRAND"></span>
      </div>
    </div>
    <label class="search">${ic('search')}<input id="homeQ" type="search" enterkeyhint="search" autocomplete="off" placeholder="${t('search_ph')}"></label>
  </section>

  <div class="stories">${stories.map((x, i) => `<button class="story${seenStories.has(x.key) ? ' seen' : ''}" data-story="${i}"><div class="ring">${img(x.image, storyLabel(x), true)}</div><span>${esc(storyLabel(x))}</span></button>`).join('')}</div>

  <section class="sec">
    ${secHead(t('categories'), '#/catalog')}
    <div class="hscroll">${cats.map((c) => {
      const n = P.filter((p) => p.category_id === c.id).length;
      return `<a class="cat-card" href="#/catalog?c=${c.id}"><div class="ph">${img(catImg(c), catName(c), true)}</div><div class="nm">${esc(catName(c))}</div><div class="ct">${t('n_products', { n })}</div></a>`;
    }).join('')}</div>
  </section>

  <section class="sec">
    <div class="banners" id="banners">${banners.map((x) => {
      const p = x.p;
      if (!p) {
        // Galereyadan yuklangan rasm — butun banner bo'ylab
        const href = x.c ? `#/catalog?c=${x.c.id}` : '';
        const tag = href ? 'a' : 'div';
        const txt = x.subtitle || x.title || href;
        return `<${tag} class="banner photo"${href ? ` href="${href}"` : ''}>${img(x.image, x.title || '', true)}
          ${txt ? `<div class="txt">${x.subtitle ? `<span class="tagline">${esc(x.subtitle)}</span>` : ''}${x.title ? `<h3>${esc(x.title)}</h3>` : ''}${href ? `<span class="go">${t('view')} ${ic('arrow')}</span>` : ''}</div>` : ''}
        </${tag}>`;
      }
      const d = pct(p);
      const tagline = x.subtitle || (d ? `-${d}% · ${t('discount')}` : (p.is_new ? t('new_collection') : (p.brand || p.badge || t('new_collection'))));
      return `<a class="banner" href="#/p/${p.id}">
        <div class="txt">
          <span class="tagline">${esc(tagline)}</span>
          <h3>${esc(x.title || p.name)}</h3>
          <div class="bp"><b>${money(p.price)}</b>${p.old_price ? `<s>${fmt(p.old_price)}</s>` : ''}</div>
          <span class="go">${t('view')} ${ic('arrow')}</span>
        </div>
        <div class="pic">${img(x.image, p.name, true)}</div>
      </a>`;
    }).join('')}</div>
    ${banners.length > 1 ? `<div class="dots" id="bdots">${banners.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : ''}
  </section>

  <section class="sec">
    ${secHead(t('popular'), '#/catalog?s=pop')}
    <div class="hscroll">${popular.map(productCard).join('')}</div>
  </section>

  <section class="sec">
    <div class="perks">
      <div class="perk"><div class="pi">${ic('shield')}</div><b>${t('perk_quality')}</b></div>
      <div class="perk"><div class="pi">${ic('truck')}</div><b>${t('perk_delivery')}</b></div>
      <div class="perk"><div class="pi">${ic('card')}</div><b>${t('perk_card')}</b></div>
    </div>
  </section>

  <section class="sec">
    ${secHead(t('fresh'), '#/catalog?s=new')}
    <div class="grid">${fresh.map(productCard).join('')}</div>
  </section>

  <section class="sec">
    ${secHead(t('contact'))}
    <div class="contact">${contactRows()}</div>
    <p class="foot">© ${new Date().getFullYear()} ${esc(D.settings.shop_name)} · ${t('footer')}</p>
  </section>`;
};

mounts.home = () => {
  const q = $('#homeQ');
  q.addEventListener('input', () => {
    if (q.value.trim()) location.hash = `#/catalog?q=${encodeURIComponent(q.value)}&focus=1`;
  });
  setupCarousel($('#banners'), $('#bdots'), true);
};

function setupCarousel(track, dotsEl, auto) {
  if (!track || track.children.length < 2) return;
  const dots = dotsEl ? $$('i', dotsEl) : [];
  const n = track.children.length;
  const step = () => track.children[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 12);
  let i = 0;
  let paused = 0;
  track.addEventListener('scroll', () => {
    const k = Math.round(track.scrollLeft / step());
    if (k !== i) { i = Math.max(0, Math.min(n - 1, k)); dots.forEach((d, j) => d.classList.toggle('on', j === i)); }
  }, { passive: true });
  track.addEventListener('touchstart', () => { paused = Date.now(); }, { passive: true });
  if (auto) {
    timers.push(setInterval(() => {
      if (document.hidden || Date.now() - paused < 6000) return;
      const next = (i + 1) % n;
      track.scrollTo({ left: next * step(), behavior: 'smooth' });
    }, 4500));
  }
}

views.catalog = (r) => {
  cat = { c: r.q.get('c') || 'all', q: r.q.get('q') || '', s: r.q.get('s') || 'pop' };
  const cats = D.categories.filter((c) => D.products.some((p) => p.category_id === c.id));
  const opts = [['pop', t('sort_pop')], ['new', t('sort_new')], ['cheap', t('sort_cheap')], ['exp', t('sort_exp')]];
  return `
  <div class="page-head"><h1>${t('catalog')}</h1><span class="sub num">${t('n_products', { n: D.products.length })}</span></div>
  <div class="cat-tools">
    <label class="search">${ic('search')}<input id="q" type="search" enterkeyhint="search" autocomplete="off" placeholder="${t('search_ph')}" value="${esc(cat.q)}"><button type="button" class="clear" data-act="clearq"${cat.q ? '' : ' hidden'} aria-label="Tozalash">${ic('x')}</button></label>
    <div class="sort-btn" title="${t('sort')}">${ic('sort')}<select id="sort" aria-label="${t('sort')}">${opts.map(([v, l]) => `<option value="${v}"${cat.s === v ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
  </div>
  <div class="chips" id="chips">
    <button class="chip${cat.c === 'all' ? ' on' : ''}" data-cat="all">${t('all')} <em>${D.products.length}</em></button>
    ${cats.map((c) => `<button class="chip${String(c.id) === cat.c ? ' on' : ''}" data-cat="${c.id}">${esc(catName(c))} <em>${D.products.filter((p) => p.category_id === c.id).length}</em></button>`).join('')}
  </div>
  <div class="result-meta"><span id="rcount"></span><span id="rsort"></span></div>
  <div class="grid" id="grid"></div>
  <div id="gridEmpty"></div>`;
};

function filtered() {
  const q = norm(cat.q);
  let list = D.products.filter((p) => cat.c === 'all' || String(p.category_id) === cat.c);
  if (q) {
    const words = q.split(' ');
    list = list.filter((p) => {
      const hay = norm([p.name, p.brand, p.color, p.badge, catName(catById(p.category_id)), catById(p.category_id)?.name].join(' '));
      return words.every((w) => hay.includes(w));
    });
  }
  const s = cat.s;
  list = [...list].sort((a, b) => {
    if (s === 'cheap') return a.price - b.price;
    if (s === 'exp') return b.price - a.price;
    if (s === 'new') return (b.is_new - a.is_new) || (b.id - a.id);
    return (b.sold_count - a.sold_count) || (b.is_featured - a.is_featured) || (a.sort - b.sort);
  });
  return list.sort((a, b) => b.in_stock - a.in_stock);
}

function renderGrid() {
  const list = filtered();
  $('#grid').innerHTML = list.map(productCard).join('');
  $('#rcount').textContent = t('n_products', { n: list.length });
  $('#gridEmpty').innerHTML = list.length ? '' : emptyBlock('search', t('nothing'), t('nothing_sub'));
  const params = new URLSearchParams();
  if (cat.c !== 'all') params.set('c', cat.c);
  if (cat.q) params.set('q', cat.q);
  if (cat.s !== 'pop') params.set('s', cat.s);
  const h = `#/catalog${params.toString() ? '?' + params : ''}`;
  if (location.hash !== h) { history.replaceState(null, '', h); nav.stack[nav.stack.length - 1] = h; nav.last = h; }
}

mounts.catalog = (r) => {
  renderGrid();
  const q = $('#q');
  let deb;
  q.addEventListener('input', () => {
    clearTimeout(deb);
    $('[data-act="clearq"]').hidden = !q.value;
    deb = setTimeout(() => { cat.q = q.value.trim(); renderGrid(); }, 160);
  });
  q.addEventListener('keydown', (e) => { if (e.key === 'Enter') q.blur(); });
  $('#sort').addEventListener('change', (e) => { cat.s = e.target.value; renderGrid(); });
  if (r.q.get('focus')) { q.focus(); const v = q.value; q.value = ''; q.value = v; }
  const on = $('#chips .chip.on');
  if (on && on.offsetLeft > window.innerWidth - 80) $('#chips').scrollLeft = on.offsetLeft - 16;
};

views.p = (r) => {
  const p = byId.get(Number(r.arg));
  if (!p) return emptyBlock('search', t('not_found'), '', `<a class="btn btn-gold" href="#/catalog">${t('go_catalog')}</a>`);
  if (pd.id !== p.id) pd = { id: p.id, size: p.sizes.length === 1 ? p.sizes[0] : null, qty: 1 };
  const c = catById(p.category_id);
  const imgs = p.images.length ? p.images : ['/img/logo-mark.png'];
  const d = pct(p);
  const fav = favs.has(p.id);
  const similar = D.products.filter((x) => x.category_id === p.category_id && x.id !== p.id).slice(0, 10);
  return `
  <div class="pd-gallery">
    <div class="pd-slides" id="slides">${imgs.map((s, i) => img(s, p.name, i === 0)).join('')}</div>
    ${imgs.length > 1 ? `<div class="dots" id="sdots">${imgs.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : ''}
    ${inTg ? '' : `<div class="pd-float l"><button data-act="back" aria-label="${t('back')}">${ic('back')}</button></div>`}
    <div class="pd-float r"><button class="fav-btn${fav ? ' on' : ''}" data-fav="${p.id}" aria-pressed="${fav}" aria-label="${t('nav_favs')}">${ic('heart')}</button></div>
  </div>
  <div class="pd-body">
    <div class="pd-brand">${esc([p.brand, catName(c)].filter(Boolean).join(' · '))}</div>
    <h1>${esc(p.name)}</h1>
    <div class="pd-price"><b>${money(p.price)}</b>${p.old_price ? `<s>${money(p.old_price)}</s>` : ''}${d ? `<span class="disc">-${d}%</span>` : ''}</div>
    <div class="pd-chips">
      ${p.color ? `<span><i></i>${t('color')}: ${esc(p.color)}</span>` : ''}
      ${p.badge ? `<span>${esc(p.badge)}</span>` : ''}
      ${p.in_stock ? '' : `<span style="color:var(--err)">${t('oos')}</span>`}
    </div>
    ${p.sizes.length ? `<div class="block-label">${t('size')}<small>${pd.size ? '' : t('choose_size')}</small></div>
    <div class="sizes" id="sizes">${p.sizes.map((s) => `<button class="size${pd.size === s ? ' on' : ''}" data-size="${esc(s)}">${esc(s)}</button>`).join('')}</div>` : ''}
    <div class="block-label">${t('qty')}</div>
    <div class="stepper"><button data-pdq="-1" aria-label="-">${ic('minus')}</button><span id="pdq">${pd.qty}</span><button data-pdq="1" aria-label="+">${ic('plus')}</button></div>
    ${p.description ? `<div class="block-label">${t('description')}</div><div class="pd-desc">${esc(p.description)}</div>` : ''}
    <div class="pd-perks">
      <div class="crow"><span class="ci">${ic('shield')}</span><div class="cx"><strong style="font-size:13.5px">${t('pd_perk1')}</strong></div></div>
      <div class="crow"><span class="ci">${ic('truck')}</span><div class="cx"><strong style="font-size:13.5px">${t('pd_perk2')}</strong></div></div>
      <div class="crow"><span class="ci">${ic('card')}</span><div class="cx"><strong style="font-size:13.5px">${t('pd_perk3')}</strong></div></div>
    </div>
  </div>
  ${similar.length ? `<section class="sec">${secHead(t('similar'), `#/catalog?c=${p.category_id}`)}<div class="hscroll">${similar.map(productCard).join('')}</div></section>` : ''}
  <div class="actionbar"><div class="in">
    <div class="ab-price"><small>${t('total_price')}</small><b id="pdTotal">${money(p.price * pd.qty)}</b></div>
    <button class="btn btn-gold" data-act="pd-add"${p.in_stock ? '' : ' disabled'}>${ic('bag')} ${p.in_stock ? t('add_to_cart') : t('oos')}</button>
  </div></div>`;
};

mounts.p = () => setupCarousel($('#slides'), $('#sdots'), false);

views.cart = () => {
  if (!cart.length) {
    return `<div class="page-head"><h1>${t('cart')}</h1></div>${emptyBlock('bag', t('cart_empty'), t('cart_empty_sub'), `<a class="btn btn-gold" href="#/catalog">${t('go_catalog')}</a>`)}`;
  }
  const sub = cartSubtotal();
  const fee = deliveryFee('delivery', sub);
  return `
  <div class="page-head"><h1>${t('cart')}</h1><span class="sub num">${cartCount()} ${t('pcs')}</span></div>
  <div class="cart-list">${cart.map((it, idx) => {
    const p = byId.get(it.id);
    return `<div class="citem">
      <a class="ph" href="#/p/${p.id}">${img(pImg(p), p.name)}</a>
      <div class="cb">
        <div class="ct"><a class="cn" href="#/p/${p.id}">${esc(p.name)}</a><button class="rm" data-crm="${idx}" aria-label="O'chirish">${ic('x')}</button></div>
        <div class="cm">${[it.size && `${t('size')}: ${esc(it.size)}`, p.color && esc(p.color)].filter(Boolean).join(' · ')}</div>
        <div class="cf"><b>${money(p.price * it.qty)}</b>
          <div class="stepper sm"><button data-cq="${idx}" data-d="-1" aria-label="-">${ic('minus')}</button><span>${it.qty}</span><button data-cq="${idx}" data-d="1" aria-label="+">${ic('plus')}</button></div>
        </div>
      </div>
    </div>`;
  }).join('')}</div>
  <div class="summary">
    <div class="srow"><span>${t('items_sum')} (${cartCount()})</span><b>${money(sub)}</b></div>
    <div class="srow"><span>${t('delivery')}</span><b>${fee ? money(fee) : t('free')}</b></div>
    <div class="srow total"><span>${t('total')}</span><b>${money(sub + fee)}</b></div>
  </div>
  ${D.settings.delivery_note ? `<div class="note">${ic('truck')}<span>${esc(D.settings.delivery_note)}</span></div>` : ''}
  <div style="height:76px"></div>
  <div class="actionbar above-tabs"><div class="in"><a class="btn btn-gold" href="#/checkout">${t('checkout')} · ${money(sub + fee)} ${ic('arrow')}</a></div></div>`;
};

views.checkout = () => {
  if (!cart.length) { setTimeout(() => location.replace('#/cart'), 0); return ''; }
  const s = D.settings;
  if (!s.pickup_enabled && co.delivery === 'pickup') co.delivery = 'delivery';
  if (!s.online_payment) co.payment = 'card';
  if (!s.card_number && s.online_payment) co.payment = 'online';
  const sub = cartSubtotal();
  const fee = deliveryFee();
  const total = sub + fee;
  const canPay = (co.payment === 'card' && !!s.card_number) || (co.payment === 'online' && s.online_payment);
  const canShare = inTg && tg.requestContact && tg.isVersionAtLeast && tg.isVersionAtLeast('6.9');
  return `
  <div class="page-head">${inTg ? '' : `<button class="back-btn" data-act="back" aria-label="${t('back')}">${ic('back')}</button>`}<h1>${t('co_title')}</h1></div>
  <div class="form">
    <section class="card-sec">
      <h3><span class="n">1</span>${t('your_info')}</h3>
      <div class="field"><label for="fName">${t('f_name')}</label><input class="input" id="fName" autocomplete="name" placeholder="${t('f_name_ph')}" value="${esc(co.name)}" maxlength="80"></div>
      <div class="field"><label for="fPhone">${t('f_phone')}</label>
        <div class="phone-row"><input class="input num" id="fPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+998 90 123 45 67" value="${esc(co.phone)}">
        ${canShare ? `<button class="icon-btn" data-act="share-phone" aria-label="${t('share_phone')}" title="${t('share_phone')}">${ic('send')}</button>` : ''}</div>
      </div>
    </section>

    <section class="card-sec">
      <h3><span class="n">2</span>${t('receive')}</h3>
      ${s.pickup_enabled ? `<div class="seg">
        <button data-deliv="delivery" class="${co.delivery === 'delivery' ? 'on' : ''}">${ic('truck')}<b>${t('deliv_courier')}</b><small>${t('deliv_courier_sub')}</small></button>
        <button data-deliv="pickup" class="${co.delivery === 'pickup' ? 'on' : ''}">${ic('store')}<b>${t('deliv_pickup')}</b><small>${t('deliv_pickup_sub')}</small></button>
      </div>` : ''}
      ${co.delivery === 'delivery' ? `
        <div class="field"><label for="fRegion">${t('f_region')}</label>
          <select class="input" id="fRegion"><option value="">${t('f_region_ph')}</option>${REGIONS.map((r) => `<option${co.region === r ? ' selected' : ''}>${esc(r)}</option>`).join('')}</select></div>
        <div class="field"><label for="fAddr">${t('f_address')}</label><textarea class="input" id="fAddr" rows="2" maxlength="300" placeholder="${t('f_address_ph')}">${esc(co.address)}</textarea>
          ${s.delivery_note ? `<span class="hint">${esc(s.delivery_note)}</span>` : ''}</div>`
      : `<div class="contact" style="margin:14px 0 0;background:var(--bg-2)"><div class="crow"><span class="ci">${ic('pin')}</span><div class="cx"><small>${t('pickup_at')}</small><strong>${esc(s.address)}</strong></div></div>
          ${s.working_hours ? `<div class="crow"><span class="ci">${ic('clock')}</span><div class="cx"><small>${t('hours')}</small><strong>${esc(s.working_hours)}</strong></div></div>` : ''}</div>`}
      <div class="field"><label for="fComment">${t('f_comment')}</label><input class="input" id="fComment" maxlength="300" placeholder="${t('f_comment_ph')}" value="${esc(co.comment)}"></div>
    </section>

    <section class="card-sec">
      <h3><span class="n">3</span>${t('payment')}</h3>
      ${s.online_payment && s.card_number ? `<div class="pay-opts">
        <button class="pay-opt${co.payment === 'card' ? ' on' : ''}" data-pay="card"><span class="ri"></span><span><b>${t('pay_card')}</b><small>${t('pay_card_sub')}</small></span>${ic('card')}</button>
        <button class="pay-opt${co.payment === 'online' ? ' on' : ''}" data-pay="online"><span class="ri"></span><span><b>${t('pay_online')}</b><small>${t('pay_online_sub')}</small></span>${ic('shield')}</button>
      </div>` : ''}
      ${co.payment === 'card' ? (s.card_number ? `
        <div class="bank">
          <div class="top"><span class="chip-ic"></span><span class="type">${esc((s.card_type || '').toUpperCase())}</span></div>
          <div class="num">${esc(s.card_number)}</div>
          <div class="bot"><span class="holder">${esc(s.card_holder || '')}</span><img class="logo-s" src="/img/logo-mark.png" alt=""></div>
        </div>
        <div class="copy-row">
          <button data-copy="${esc(s.card_number.replace(/\s/g, ''))}">${ic('copy')} ${t('copy_card')}</button>
          <button data-copy="${total}">${ic('copy')} ${t('copy_sum')}</button>
        </div>
        <ol class="steps"><li><span>${t('step1', { sum: money(total) })}</span></li><li><span>${t('step2')}</span></li><li><span>${t('step3')}</span></li></ol>
        <label class="upload${receipt ? ' done' : ''}" id="upl">
          <input type="file" id="fReceipt" accept="image/*">
          <span class="ui">${receipt ? `<img src="${receipt.preview}" alt="">` : ic('upload')}</span>
          <span><b>${receipt ? t('upload_done') : t('upload')}</b><small>${receipt ? t('upload_change') : t('upload_sub')}</small></span>
        </label>` : `<div class="note" style="margin:14px 0 0;background:rgba(231,105,92,.1)">${ic('alert')}<span>${t('card_missing')}</span></div>`)
      : `<div class="note" style="margin:14px 0 0">${ic('info')}<span>${t('online_note')}</span></div>`}
    </section>
  </div>

  <div class="summary">
    <div class="srow"><span>${t('items_sum')} (${cartCount()})</span><b>${money(sub)}</b></div>
    ${co.delivery === 'delivery' ? `<div class="srow"><span>${t('delivery')}</span><b>${fee ? money(fee) : t('free')}</b></div>` : ''}
    <div class="srow total"><span>${t('total')}</span><b>${money(total)}</b></div>
  </div>
  <div class="actionbar"><div class="in">
    <div class="ab-price"><small>${t('total')}</small><b>${money(total)}</b></div>
    <button class="btn btn-gold" id="submitBtn" data-act="submit"${canPay ? '' : ' disabled'}>${ic('check')} ${t('confirm_short')}</button>
  </div></div>`;
};

mounts.checkout = () => {
  const bind = (id, key, fn) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', () => { if (fn) fn(el); co[key] = el.value; saveCo(); el.classList.remove('err'); });
    el.addEventListener('change', () => { co[key] = el.value; saveCo(); el.classList.remove('err'); });
  };
  bind('#fName', 'name');
  bind('#fPhone', 'phone', (el) => {
    const f = fmtPhone(el.value);
    if (el.value !== f && el.value.replace(/\D/g, '').length) el.value = f;
  });
  bind('#fRegion', 'region');
  bind('#fAddr', 'address');
  bind('#fComment', 'comment');
  const ph = $('#fPhone');
  ph.addEventListener('focus', () => { if (!ph.value) ph.value = '+998 '; });
  ph.addEventListener('blur', () => { if (ph.value.replace(/\D/g, '') === '998') { ph.value = ''; co.phone = ''; saveCo(); } });
  const f = $('#fReceipt');
  if (f) f.addEventListener('change', async () => {
    const file = f.files && f.files[0];
    if (!file) return;
    try {
      receipt = await compressImage(file);
      hap.note('success');
      rerender();
    } catch { toast(t('err_img'), 'err'); }
  });
};

function validateCheckout() {
  const s = D.settings;
  const bad = [];
  if ((co.name || '').trim().length < 2) bad.push(['#fName', t('err_name')]);
  if (!phoneOk(co.phone)) bad.push(['#fPhone', t('err_phone')]);
  if (co.delivery === 'delivery') {
    if (!co.region) bad.push(['#fRegion', t('err_region')]);
    if ((co.address || '').trim().length < 5) bad.push(['#fAddr', t('err_address')]);
  }
  if (co.payment === 'card' && s.card_number && !receipt) bad.push(['#upl', t('err_receipt')]);
  $$('.input.err, .upload.err').forEach((el) => el.classList.remove('err'));
  for (const [sel] of bad) { const el = $(sel); if (el) el.classList.add('err'); }
  if (bad.length) {
    const el = $(bad[0][0]);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast(bad[0][1], 'err');
    hap.note('error');
    return false;
  }
  return true;
}

async function submitOrder() {
  if (busy || !validateCheckout()) return;
  busy = true;
  const btn = $('#submitBtn');
  const label = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spin"></span>';
  try {
    const r = await fetch('/api/order', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        initData: (tg && tg.initData) || '',
        lang,
        items: cart,
        name: co.name,
        phone: co.phone,
        delivery: co.delivery,
        region: co.region,
        address: co.address,
        comment: co.comment,
        payment: co.payment,
        receipt: co.payment === 'card' && receipt ? { data: receipt.data, mime: receipt.mime } : null,
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || t('err_network'));
    myOrders = null;
    if (j.invoice_link && tg && tg.openInvoice) {
      tg.openInvoice(j.invoice_link, (status) => {
        if (status === 'paid') finishOrder(j.id, true);
        else { toast(t('pay_not_done'), 'err'); location.hash = `#/order/${j.id}`; }
      });
      return;
    }
    finishOrder(j.id, false);
  } catch (e) {
    toast(e.message || t('err_network'), 'err');
    hap.note('error');
  } finally {
    busy = false;
    const b = $('#submitBtn');
    if (b) { b.disabled = false; b.innerHTML = label; }
  }
}

function finishOrder(id, paid) {
  cart = [];
  saveCart();
  receipt = null;
  co.comment = '';
  saveCo();
  updateBadge();
  hap.note('success');
  location.hash = `#/success/${id}${paid ? '?paid=1' : ''}`;
}

views.success = (r) => `
  <div class="success">
    <div class="ok">${ic('check')}</div>
    <h1>${t('success')}</h1>
    <div class="oid">${t('order')} #${esc(r.arg)}</div>
    <p>${r.q.get('paid') ? t('success_paid') : t('success_card')}</p>
    <div class="btns">
      ${inTg ? `<a class="btn btn-gold" href="#/order/${esc(r.arg)}">${ic('box')} ${t('my_orders')}</a>` : ''}
      <a class="btn btn-ghost" href="#/">${t('home')}</a>
    </div>
  </div>`;

views.favs = () => {
  const list = D.products.filter((p) => favs.has(p.id));
  return `<div class="page-head"><h1>${t('favs')}</h1>${list.length ? `<span class="sub num">${list.length}</span>` : ''}</div>
    ${list.length ? `<div class="grid" style="margin-top:8px">${list.map(productCard).join('')}</div>`
      : emptyBlock('heart', t('favs_empty'), t('favs_empty_sub'), `<a class="btn btn-gold" href="#/catalog">${t('go_catalog')}</a>`)}`;
};

views.profile = () => {
  const name = user ? [user.first_name, user.last_name].filter(Boolean).join(' ') : t('guest');
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const s = D.settings;
  return `
  <div class="page-head"><h1>${t('profile')}</h1></div>
  <div class="prof">
    <div class="avatar">${user && user.photo_url ? `<img src="${esc(user.photo_url)}" alt="">` : `<span>${esc(initials)}</span>`}</div>
    <div class="min"><h2>${esc(name)}</h2><p>${user && user.username ? '@' + esc(user.username) : esc(s.shop_name)}</p></div>
  </div>
  <div class="menu">
    <a class="crow" href="#/orders"><span class="ci">${ic('box')}</span><div class="cx"><strong>${t('my_orders')}</strong></div><span class="val num">${myOrders ? myOrders.length : ''}</span><span class="chev">${ic('chev')}</span></a>
    <a class="crow" href="#/favs"><span class="ci">${ic('heart')}</span><div class="cx"><strong>${t('favs')}</strong></div><span class="val num">${favs.size || ''}</span><span class="chev">${ic('chev')}</span></a>
    <div class="crow"><span class="ci">${ic('globe')}</span><div class="cx"><strong>${t('language')}</strong></div>
      <div class="lang-seg"><button data-lang="uz" class="${lang === 'uz' ? 'on' : ''}">O'zbek</button><button data-lang="ru" class="${lang === 'ru' ? 'on' : ''}">Русский</button></div></div>
  </div>
  <div class="menu-title">${t('store')}</div>
  <div class="contact" style="margin-top:10px">${contactRows()}</div>
  <p class="foot">© ${new Date().getFullYear()} ${esc(s.shop_name)} · ${t('footer')}</p>`;
};
mounts.profile = () => { if (inTg && !myOrders) loadOrders(); };

views.orders = () => {
  const head = `<div class="page-head">${inTg ? '' : `<button class="back-btn" data-act="back">${ic('back')}</button>`}<h1>${t('my_orders')}</h1></div>`;
  if (!inTg) return head + emptyBlock('send', t('my_orders'), t('open_in_tg'));
  if (!myOrders) return head + `<div class="olist">${[1, 2, 3].map(() => '<div class="skel" style="height:150px"></div>').join('')}</div>`;
  if (!myOrders.length) return head + emptyBlock('box', t('no_orders'), ordersErr || t('no_orders_sub'), `<a class="btn btn-gold" href="#/catalog">${t('go_catalog')}</a>`);
  return head + `<div class="olist">${myOrders.map((o) => `
    <a class="ocard" href="#/order/${o.id}">
      <div class="oh"><div><b>#${o.id}</b><div class="od">${fmtDate(o.created_at)}</div></div>${statusChip(o)}</div>
      <div class="othumbs">${o.items.slice(0, 5).map((it) => img(it.image || '/img/logo-mark.png', it.name)).join('')}${o.items.length > 5 ? `<span>+${o.items.length - 5}</span>` : ''}</div>
      <div class="of"><span>${o.items.reduce((a, i) => a + i.qty, 0)} ${t('pcs')}</span><b>${money(o.total)}</b></div>
    </a>`).join('')}</div>`;
};
mounts.orders = () => { if (inTg && !myOrders) loadOrders(); };

views.order = (r) => {
  const head = (title) => `<div class="page-head">${inTg ? '' : `<button class="back-btn" data-act="back">${ic('back')}</button>`}<h1>${title}</h1></div>`;
  if (!inTg) return head(t('order')) + emptyBlock('send', t('order'), t('open_in_tg'));
  if (!myOrders) return head(`${t('order')} #${esc(r.arg)}`) + '<div class="olist"><div class="skel" style="height:220px"></div><div class="skel" style="height:160px"></div></div>';
  const o = myOrders.find((x) => String(x.id) === String(r.arg));
  if (!o) return head(t('order')) + emptyBlock('box', t('no_orders'), '');
  const flow = ['checking', 'paid', 'shipping', 'delivered'];
  const pos = o.status === 'awaiting_payment' ? 0 : flow.indexOf(o.status);
  const bad = o.status === 'rejected' || o.status === 'cancelled';
  const steps = [
    { k: 'tl_created', done: true, time: o.created_at },
    { k: 'tl_checked', done: pos >= 1, time: o.paid_at },
    { k: o.delivery_type === 'pickup' ? 'tl_ready' : 'tl_shipping', done: pos >= 2 },
    { k: 'tl_delivered', done: pos >= 3 },
  ];
  const s = D.settings;
  return head(`${t('order')} #${o.id}`) + `
  <div class="form">
    <section class="card-sec">
      <div class="oh" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><span class="muted" style="font-size:13px;font-weight:600">${fmtDate(o.created_at)}</span>${statusChip(o)}</div>
      ${bad ? `<ol class="timeline"><li class="done"><span class="dot">${ic('check')}</span><div><b>${t('tl_created')}</b><small>${fmtDate(o.created_at)}</small></div></li>
        <li class="bad cur"><span class="dot">${ic('x')}</span><div><b>${t('st_' + o.status)}</b>${o.admin_note ? `<small>${esc(o.admin_note)}</small>` : ''}</div></li></ol>`
      : `<ol class="timeline">${steps.map((st, i) => `<li class="${st.done ? 'done' : ''}${i === pos + 1 || (i === pos && pos === 3) ? ' cur' : ''}"><span class="dot">${st.done ? ic('check') : ''}</span><div><b>${t(st.k)}</b>${st.time && st.done ? `<small>${fmtDate(st.time)}</small>` : ''}</div></li>`).join('')}</ol>`}
    </section>
    <section class="card-sec">
      <h3>${t('items')}</h3>
      ${o.items.map((it) => `<div class="citem" style="margin-top:10px;background:var(--bg-2)">
        <a class="ph" href="#/p/${it.id}">${img(it.image || '/img/logo-mark.png', it.name)}</a>
        <div class="cb"><div class="cn">${esc(it.name)}</div><div class="cm">${[it.size && `${t('size')}: ${esc(it.size)}`, it.color && esc(it.color), `${it.qty} ${t('pcs')}`].filter(Boolean).join(' · ')}</div>
        <div class="cf"><b>${money(it.price * it.qty)}</b></div></div></div>`).join('')}
    </section>
    <section class="card-sec">
      <h3>${t('receiving')}</h3>
      <div class="crow" style="border:0;padding-bottom:4px"><span class="ci">${ic(o.delivery_type === 'pickup' ? 'store' : 'truck')}</span><div class="cx"><small>${o.delivery_type === 'pickup' ? t('deliv_pickup') : t('deliv_courier')}</small><strong>${esc(o.delivery_type === 'pickup' ? s.address : [o.region, o.address].filter(Boolean).join(', '))}</strong></div></div>
      <div class="crow" style="border:0;padding-top:4px"><span class="ci">${ic('card')}</span><div class="cx"><small>${t('pay_method')}</small><strong>${o.payment_method === 'online' ? t('pay_online') : t('pay_card')}</strong></div></div>
      ${o.admin_note && !bad ? `<div class="note" style="margin:8px 0 0">${ic('info')}<span><b>${t('order_note')}:</b> ${esc(o.admin_note)}</span></div>` : ''}
    </section>
  </div>
  <div class="summary">
    <div class="srow"><span>${t('items_sum')}</span><b>${money(o.subtotal)}</b></div>
    ${o.delivery_type === 'delivery' ? `<div class="srow"><span>${t('delivery')}</span><b>${o.delivery_price ? money(o.delivery_price) : t('free')}</b></div>` : ''}
    <div class="srow total"><span>${t('total')}</span><b>${money(o.total)}</b></div>
  </div>
  ${bad && (s.phones || [])[0] ? `<div class="wrap" style="margin-top:14px"><a class="btn btn-ghost" href="tel:${esc(s.phones[0].replace(/[^\d+]/g, ''))}">${ic('phone')} ${t('contact_us')}</a></div>` : ''}`;
};
mounts.order = () => { if (inTg && !myOrders) loadOrders(); };

async function loadOrders() {
  if (!inTg || loadOrders.busy) return;
  loadOrders.busy = true;
  try {
    const r = await fetch('/api/order', { headers: { 'x-telegram-init-data': tg.initData } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || t('err_network'));
    myOrders = j.orders || [];
    ordersErr = null;
  } catch (e) {
    myOrders = [];
    ordersErr = e.message;
  } finally {
    loadOrders.busy = false;
  }
  if (['orders', 'order', 'profile'].includes(route().name)) rerender();
}

function viewError() {
  return emptyBlock('alert', t('load_err'), t('err_network'), `<button class="btn btn-gold" data-act="retry">${t('retry')}</button>`);
}

function viewLoading() {
  return `<div style="padding:24px 16px"><div class="skel" style="height:64px;width:70%"></div><div class="skel" style="height:54px;margin-top:22px"></div>
    <div style="display:flex;gap:14px;margin-top:20px">${[1, 2, 3, 4].map(() => '<div class="skel" style="width:76px;height:76px;border-radius:50%"></div>').join('')}</div>
    <div class="skel" style="height:196px;margin-top:26px;border-radius:26px"></div></div>`;
}

/* ---------------- quick-add sheet ---------------- */
function openSheet(p) {
  sheetSel = { id: p.id, size: p.sizes.length === 1 ? p.sizes[0] : null };
  renderSheet();
  $('#sheet').hidden = false;
  hap.tap();
}
function renderSheet() {
  const p = byId.get(sheetSel.id);
  $('#sheet').innerHTML = `<div class="sheet-bg" data-act="sheet-close"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="${t('choose_size')}">
    <div class="grab"></div>
    <div class="sp">${img(pImg(p), p.name)}<div><b>${esc(p.name)}</b><span>${money(p.price)}</span></div></div>
    <div class="block-label">${t('choose_size')}</div>
    <div class="sizes" id="ssizes">${p.sizes.map((s) => `<button class="size${sheetSel.size === s ? ' on' : ''}" data-ssize="${esc(s)}">${esc(s)}</button>`).join('')}</div>
    <button class="btn btn-gold" data-act="sheet-add">${ic('bag')} ${t('add_to_cart')}</button>
  </div>`;
}
function closeSheet() { $('#sheet').hidden = true; $('#sheet').innerHTML = ''; sheetSel = null; }

/* ---------------- story viewer ---------------- */
const STORY_MS = 5000;

function openStory(i) {
  if (!homeStories[i]) return;
  sv = { i, elapsed: 0, last: performance.now(), paused: false, loading: true, raf: 0, downAt: 0 };
  $('#story').hidden = false;
  document.body.classList.add('story-open');
  if (tg && tg.BackButton) tg.BackButton.show();
  hap.tap();
  showStory();
  sv.raf = requestAnimationFrame(tickStory);
}

function showStory() {
  const x = homeStories[sv.i];
  if (!x) return closeStory();
  sv.elapsed = 0;
  sv.loading = true;
  if (!seenStories.has(x.key)) {
    seenStories.add(x.key);
    store.set('seen', [...seenStories].slice(-300));
  }
  const ring = $(`.story[data-story="${sv.i}"]`);
  if (ring) ring.classList.add('seen');
  const href = x.p ? `#/p/${x.p.id}` : (x.c ? `#/catalog?c=${x.c.id}` : '');
  $('#story').innerHTML = `
    <img class="sv-blur" src="${esc(x.image)}" alt="">
    <img class="sv-img" src="${esc(x.image)}" alt="${esc(storyLabel(x))}">
    <div class="sv-top">
      <div class="sv-bars">${homeStories.map((_, j) => `<i><b style="width:${j < sv.i ? 100 : 0}%"></b></i>`).join('')}</div>
      <div class="sv-head"><span class="sv-av"><img src="/img/logo-mark.png" alt=""></span><b>${esc(storyLabel(x))}</b>
        <button class="sv-x" data-act="story-close" aria-label="${t('back')}">${ic('x')}</button></div>
    </div>
    ${x.subtitle || href ? `<div class="sv-foot">
      ${x.subtitle ? `<p>${esc(x.subtitle)}</p>` : ''}
      ${x.p ? `<a class="sv-card" href="${href}" data-act="story-go">${img(pImg(x.p), x.p.name, true)}<span class="t"><b>${esc(x.p.name)}</b><em>${money(x.p.price)}</em></span><span class="go">${t('view')} ${ic('arrow')}</span></a>`
        : href ? `<a class="btn btn-gold" href="${href}" data-act="story-go">${t('view')} ${ic('arrow')}</a>` : ''}
    </div>` : ''}`;
  const im = $('#story .sv-img');
  const ready = () => { if (sv) { sv.loading = false; sv.last = performance.now(); } };
  if (im.complete) ready(); else { im.onload = ready; im.onerror = ready; }
}

function tickStory(now) {
  if (!sv) return;
  const dt = now - sv.last;
  sv.last = now;
  if (!sv.paused && !sv.loading && !document.hidden) sv.elapsed += dt;
  const bar = $$('#story .sv-bars b')[sv.i];
  if (bar) bar.style.width = `${Math.min(100, (sv.elapsed / STORY_MS) * 100)}%`;
  if (sv.elapsed >= STORY_MS) { stepStory(1); return; }
  sv.raf = requestAnimationFrame(tickStory);
}

function stepStory(d) {
  if (!sv) return;
  const n = sv.i + d;
  if (n >= homeStories.length) { closeStory(); return; }
  if (n >= 0) { sv.i = n; showStory(); } else sv.elapsed = 0;
  hap.tap();
  cancelAnimationFrame(sv.raf);
  sv.last = performance.now();
  sv.raf = requestAnimationFrame(tickStory);
}

function closeStory() {
  if (!sv) return;
  cancelAnimationFrame(sv.raf);
  sv = null;
  const el = $('#story');
  el.hidden = true;
  el.innerHTML = '';
  document.body.classList.remove('story-open');
  if (tg && tg.BackButton && TABS.includes(route().name)) tg.BackButton.hide();
}

// Bosib turish — pauza, chap tomonga tegish — oldingi, o'ngga — keyingi, pastga surish — yopish
(() => {
  const el = $('#story');
  el.addEventListener('pointerdown', (e) => {
    if (!sv || e.target.closest('.sv-foot,.sv-x')) return;
    sv.paused = true;
    sv.downAt = Date.now();
    sv.downX = e.clientX;
    sv.downY = e.clientY;
  });
  el.addEventListener('pointerup', (e) => {
    if (!sv || !sv.downAt) return;
    const held = Date.now() - sv.downAt;
    sv.paused = false;
    sv.downAt = 0;
    if (e.clientY - sv.downY > 80) { closeStory(); return; }
    if (held < 300 && Math.abs(e.clientX - sv.downX) < 30) stepStory(e.clientX < window.innerWidth / 3 ? -1 : 1);
  });
  el.addEventListener('pointercancel', () => { if (sv) { sv.paused = false; sv.downAt = 0; } });
  el.addEventListener('contextmenu', (e) => e.preventDefault());
})();

/* ---------------- cart ops ---------------- */
function addToCart(id, size, qty = 1) {
  const it = cart.find((i) => i.id === id && i.size === size);
  if (it) it.qty = Math.min(it.qty + qty, 20);
  else cart.push({ id, size, qty });
  saveCart();
  updateBadge(true);
  hap.hit('medium');
  toast(t('added'), 'ok', { href: '#/cart', text: t('to_cart') });
}

function updateBadge(bump) {
  const n = cartCount();
  const b = $('#cartBadge');
  b.textContent = n > 99 ? '99+' : n;
  b.hidden = !n;
  if (bump) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
}

/* ---------------- router ---------------- */
const TABS = ['home', 'catalog', 'cart', 'favs', 'profile'];
const nav = { stack: [], last: null, back: false, scroll: {} };

function route() {
  const h = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = h.split('?');
  const parts = path.split('/').filter(Boolean);
  return { name: parts[0] || 'home', arg: parts[1] ? decodeURIComponent(parts[1]) : null, q: new URLSearchParams(qs || '') };
}

function onHashChange() {
  closeStory();
  const h = location.hash || '#/';
  if (nav.last) nav.scroll[nav.last] = window.scrollY;
  if (nav.stack.length > 1 && nav.stack[nav.stack.length - 2] === h) { nav.stack.pop(); nav.back = true; }
  else { nav.stack.push(h); nav.back = false; }
  render();
}

function goBack() {
  if (sv) closeStory();
  else if (route().name === 'success') location.hash = '#/';
  else if (nav.stack.length > 1) history.back();
  else location.replace('#/');
}

function render(keepScroll) {
  timers.forEach(clearInterval);
  timers = [];
  const r = route();
  const h = location.hash || '#/';
  const fn = views[r.name] || views.home;
  const isTab = TABS.includes(r.name);
  document.body.classList.toggle('hide-tabs', !isTab);
  const view = $('#view');
  view.className = `view${isTab ? '' : ' no-tabs'}`;
  view.innerHTML = D ? fn(r) : (render.failed ? viewError() : viewLoading());
  if (D && mounts[r.name]) mounts[r.name](r);
  $$('#tabbar [data-tab]').forEach((a) => a.classList.toggle('on', a.dataset.tab === r.name));
  if (tg && tg.BackButton) { if (isTab) tg.BackButton.hide(); else tg.BackButton.show(); }
  if (!keepScroll) window.scrollTo(0, nav.back ? (nav.scroll[h] || 0) : 0);
  nav.last = h;
}
function rerender() { const y = window.scrollY; render(true); window.scrollTo(0, y); }

function applyStaticI18n() {
  document.documentElement.lang = lang === 'ru' ? 'ru' : 'uz';
  $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
}

function setLang(l) {
  if (l === lang) return;
  lang = l;
  store.set('lang', lang);
  applyStaticI18n();
  hap.tap();
  rerender();
}

/* ---------------- events ---------------- */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act],[data-fav],[data-add],[data-size],[data-ssize],[data-pdq],[data-cq],[data-crm],[data-copy],[data-deliv],[data-pay],[data-link],[data-lang],[data-cat],[data-story]');
  if (!el) return;
  const ds = el.dataset;

  if (ds.fav) {
    e.preventDefault();
    const id = Number(ds.fav);
    if (favs.has(id)) favs.delete(id); else favs.add(id);
    saveFavs();
    hap.hit('light');
    $$(`[data-fav="${id}"]`).forEach((b) => { b.classList.toggle('on', favs.has(id)); b.setAttribute('aria-pressed', favs.has(id)); });
    if (route().name === 'favs') rerender();
    return;
  }
  if (ds.add) {
    e.preventDefault();
    const p = byId.get(Number(ds.add));
    if (!p || !p.in_stock) return;
    if (p.sizes.length > 1) openSheet(p);
    else addToCart(p.id, p.sizes[0] || '');
    return;
  }
  if (ds.size) {
    pd.size = ds.size;
    hap.tap();
    $$('#sizes .size').forEach((b) => b.classList.toggle('on', b.dataset.size === pd.size));
    const small = $('#sizes')?.previousElementSibling?.querySelector('small');
    if (small) small.textContent = '';
    return;
  }
  if (ds.ssize) {
    sheetSel.size = ds.ssize;
    hap.tap();
    $$('#ssizes .size').forEach((b) => b.classList.toggle('on', b.dataset.ssize === sheetSel.size));
    return;
  }
  if (ds.pdq) {
    pd.qty = Math.min(20, Math.max(1, pd.qty + Number(ds.pdq)));
    hap.tap();
    $('#pdq').textContent = pd.qty;
    const p = byId.get(pd.id);
    $('#pdTotal').textContent = money(p.price * pd.qty);
    return;
  }
  if (ds.cq) {
    const it = cart[Number(ds.cq)];
    if (!it) return;
    it.qty += Number(ds.d);
    if (it.qty < 1) cart.splice(Number(ds.cq), 1);
    it.qty = Math.min(it.qty, 20);
    saveCart(); updateBadge(); hap.tap(); rerender();
    return;
  }
  if (ds.crm) {
    cart.splice(Number(ds.crm), 1);
    saveCart(); updateBadge(); hap.hit('light'); rerender();
    return;
  }
  if (ds.copy) { copyText(ds.copy); return; }
  if (ds.deliv) { co.delivery = ds.deliv; saveCo(); hap.tap(); rerender(); return; }
  if (ds.pay) { co.payment = ds.pay; saveCo(); hap.tap(); rerender(); return; }
  if (ds.link) { e.preventDefault(); openLink(ds.link); return; }
  if (ds.lang) { setLang(ds.lang); return; }
  if (ds.story) { openStory(Number(ds.story)); return; }
  if (ds.cat) {
    cat.c = ds.cat;
    hap.tap();
    $$('#chips .chip').forEach((c) => c.classList.toggle('on', c.dataset.cat === cat.c));
    renderGrid();
    return;
  }

  switch (ds.act) {
    case 'lang': setLang(lang === 'uz' ? 'ru' : 'uz'); break;
    case 'back': goBack(); break;
    case 'retry': render.failed = false; render(); loadCatalog(); break;
    case 'clearq': { const q = $('#q'); q.value = ''; cat.q = ''; el.hidden = true; renderGrid(); q.focus(); break; }
    case 'sheet-close': closeSheet(); break;
    case 'story-close': closeStory(); break;
    case 'story-go': closeStory(); break;
    case 'sheet-add': {
      if (!sheetSel.size) { const s = $('#ssizes'); s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake'); hap.note('warning'); break; }
      addToCart(sheetSel.id, sheetSel.size);
      closeSheet();
      break;
    }
    case 'pd-add': {
      const p = byId.get(pd.id);
      if (p.sizes.length && !pd.size) {
        const s = $('#sizes');
        s.scrollIntoView({ behavior: 'smooth', block: 'center' });
        s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake');
        hap.note('warning');
        toast(t('choose_size'), 'err');
        break;
      }
      addToCart(p.id, pd.size || '', pd.qty);
      break;
    }
    case 'share-phone':
      tg.requestContact((ok, res) => {
        const num = ok && res && res.responseUnsafe && res.responseUnsafe.contact && res.responseUnsafe.contact.phone_number;
        if (num) { co.phone = fmtPhone(num); saveCo(); const el2 = $('#fPhone'); if (el2) { el2.value = co.phone; el2.classList.remove('err'); } hap.note('success'); }
      });
      break;
    case 'submit': submitOrder(); break;
    default: break;
  }
});

document.addEventListener('keydown', (e) => {
  if (sv) {
    if (e.key === 'Escape') closeStory();
    else if (e.key === 'ArrowRight') stepStory(1);
    else if (e.key === 'ArrowLeft') stepStory(-1);
    return;
  }
  if (e.key === 'Escape' && sheetSel) closeSheet();
});

/* ---------------- boot ---------------- */
async function loadCatalog() {
  try {
    const r = await fetch('/api/catalog', { cache: 'no-cache' });
    if (!r.ok) throw new Error(String(r.status));
    const fresh = await r.json();
    const changed = JSON.stringify(fresh) !== JSON.stringify(D);
    D = fresh;
    store.set('catalog', D);
    indexData();
    updateBadge();
    if (changed) rerender();
  } catch (e) {
    if (!D) { render.failed = true; render(); }
  } finally {
    hideSplash();
  }
}

function hideSplash() {
  const s = $('#splash');
  if (!s || s.classList.contains('out')) return;
  s.classList.add('out');
  setTimeout(() => s.remove(), 400);
}

if (tg) {
  try { tg.ready(); tg.expand(); } catch {}
  try { tg.setHeaderColor('#0C0B09'); tg.setBackgroundColor('#0C0B09'); } catch {}
  try { if (tg.setBottomBarColor) tg.setBottomBarColor('#0C0B09'); } catch {}
  try { if (tg.isVersionAtLeast && tg.isVersionAtLeast('7.7')) tg.disableVerticalSwipes(); } catch {}
  try { tg.BackButton.onClick(goBack); } catch {}
  const sp = tg.initDataUnsafe && tg.initDataUnsafe.start_param;
  const m = sp && /^p_?(\d+)$/.exec(sp);
  if (m && !location.hash) history.replaceState(null, '', `#/p/${m[1]}`);
}

applyStaticI18n();
updateBadge();
nav.stack.push(location.hash || '#/');
window.addEventListener('hashchange', onHashChange);
render();
if (D) setTimeout(hideSplash, 250);
loadCatalog();
})();
