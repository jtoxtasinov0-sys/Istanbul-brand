/* ISTANBUL BRAND — Admin panel */
(() => {
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const money = (n) => `${fmt(n)} so'm`;
const TOKEN_KEY = 'ib_admin_token';
let token = (() => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } })();

const STATUS = {
  checking: "To'lov tekshirilmoqda",
  awaiting_payment: "To'lov kutilmoqda",
  paid: "To'langan",
  shipping: "Yo'lda",
  delivered: 'Yetkazildi',
  rejected: "To'lov rad etildi",
  cancelled: 'Bekor qilingan',
};
const NEXT = {
  checking: [['paid', "To'lovni tasdiqlash", 'btn-ok'], ['rejected', 'Rad etish', 'btn-danger']],
  awaiting_payment: [['paid', "To'langan deb belgilash", 'btn-ok'], ['cancelled', 'Bekor qilish', 'btn-danger']],
  paid: [['shipping', "Yo'lga chiqdi", 'btn-gold'], ['cancelled', 'Bekor qilish', 'btn-danger']],
  shipping: [['delivered', 'Yetkazildi', 'btn-gold']],
  rejected: [['paid', 'Baribir tasdiqlash', 'btn-ok'], ['cancelled', 'Bekor qilish', 'btn-danger']],
  delivered: [],
  cancelled: [],
};
const SIZE_PRESETS = [['Kiyim', 'M, L, XL, 2XL, 3XL'], ['Shim', '30, 31, 32, 33, 34, 36'], ['Oyoq kiyim', '39, 40, 41, 42, 43, 44'], ['Yagona', 'Yagona']];

const ICON = {
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 12.5A1.5 1.5 0 0 0 8 21h8a1.5 1.5 0 0 0 1.5-1.5l1-12.5M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/>',
  left: '<path d="m15 6-6 6 6 6"/>',
  right: '<path d="m9 6 6 6-6 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"/>',
  bag: '<path d="M5.5 8h13l-1.1 11.2a1.5 1.5 0 0 1-1.5 1.3H8.1a1.5 1.5 0 0 1-1.5-1.3z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>',
  money: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.5"/><path d="M6.5 9.5v5M17.5 9.5v5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  truck: '<path d="M3 6.5h11v9H3zM14 9.5h3.8l3.2 3.4v2.6h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>',
  users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  send: '<path d="M21 3 3 10.5l7 2.5 2.5 7z"/><path d="m21 3-11 10"/>',
  link: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V7.5A1.5 1.5 0 0 1 5.5 6H10"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
};
const ic = (n) => `<svg viewBox="0 0 24 24">${ICON[n] || ''}</svg>`;

/* ---------------- api ---------------- */
async function api(action, { qs = '', body, raw } = {}) {
  const r = await fetch(`/api/admin?action=${action}${qs ? '&' + qs : ''}`, {
    method: body ? 'POST' : 'GET',
    headers: { authorization: `Bearer ${token}`, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 401 && action !== 'login') { logout(); throw new Error('Sessiya tugadi. Qaytadan kiring'); }
  if (raw) { if (!r.ok) throw new Error('Topilmadi'); return r; }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Xatolik yuz berdi');
  return j;
}

/* ---------------- ui helpers ---------------- */
let toastT;
function toast(msg, err) {
  const el = $('#toast');
  el.className = `toast${err ? ' err' : ''}`;
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(() => { el.hidden = true; }, err ? 4200 : 2600);
}

function fmtDate(s, short) {
  if (!s) return '—';
  const d = new Date(s);
  const p = (n) => String(n).padStart(2, '0');
  return short ? `${p(d.getDate())}.${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`
    : `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const chip = (s) => `<span class="st ${esc(s)}">${esc(STATUS[s] || s)}</span>`;
const loading = () => '<div class="loading"><span class="spin light" style="width:30px;height:30px"></span></div>';

function openModal(html, cls = '') {
  const m = $('#modal');
  m.innerHTML = `<div class="backdrop" data-close></div><div class="modal ${cls}" role="dialog" aria-modal="true">${html}</div>`;
  m.hidden = false;
  return $('.modal', m);
}
function closeModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; }
function openDrawer(html) {
  const d = $('#drawer');
  d.innerHTML = `<div class="backdrop" data-close-drawer></div><div class="drawer" role="dialog" aria-modal="true">${html}</div>`;
  d.hidden = false;
  return $('.drawer', d);
}
function closeDrawer() {
  const d = $('#drawer');
  d.hidden = true; d.innerHTML = '';
  if (/^#order-/.test(location.hash)) history.replaceState(null, '', `#${$('#main').dataset.page || 'orders'}`);
}
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) closeModal();
  if (e.target.closest('[data-close-drawer]')) closeDrawer();
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('#modal').hidden) closeModal(); else if (!$('#drawer').hidden) closeDrawer();
});

function confirmBox(text, okLabel = "O'chirish") {
  return new Promise((resolve) => {
    const m = openModal(`<div class="mh"><h2>Tasdiqlang</h2></div><div class="mb"><p style="margin:0">${text}</p></div>
      <div class="mf"><button class="btn btn-ghost" data-no>Bekor qilish</button><button class="btn btn-danger" data-yes>${okLabel}</button></div>`, 'sm');
    $('[data-no]', m).onclick = () => { closeModal(); resolve(false); };
    $('[data-yes]', m).onclick = () => { closeModal(); resolve(true); };
  });
}

async function busyBtn(btn, fn) {
  if (btn.disabled) return;
  const html = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spin${btn.classList.contains('btn-gold') ? '' : ' light'}"></span>`;
  try { return await fn(); }
  catch (e) { toast(e.message, true); }
  finally { btn.disabled = false; btn.innerHTML = html; }
}

async function compressImage(file, max = 1400, q = 0.85) {
  const url = URL.createObjectURL(file);
  try {
    const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(im.naturalWidth * k));
    c.height = Math.max(1, Math.round(im.naturalHeight * k));
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(im, 0, 0, c.width, c.height);
    return { data: c.toDataURL('image/jpeg', q).split(',')[1], mime: 'image/jpeg' };
  } finally { URL.revokeObjectURL(url); }
}

async function uploadFiles(files) {
  const urls = [];
  for (const f of files) {
    const img = await compressImage(f);
    const r = await api('upload', { body: img });
    urls.push(r.url);
  }
  return urls;
}

/* ---------------- auth ---------------- */
function logout() {
  token = '';
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
  $('#shell').hidden = true;
  $('#login').hidden = false;
  setTimeout(() => $('#pw').focus(), 50);
}

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('#loginBtn');
  $('#loginErr').hidden = true;
  btn.disabled = true;
  btn.innerHTML = '<span class="spin"></span>';
  try {
    const r = await api('login', { body: { password: $('#pw').value } });
    token = r.token;
    try { localStorage.setItem(TOKEN_KEY, token); } catch {}
    $('#pw').value = '';
    start();
  } catch (err) {
    $('#loginErr').textContent = err.message;
    $('#loginErr').hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Kirish';
  }
});
$('#logoutBtn').addEventListener('click', logout);

/* ---------------- router ---------------- */
const pages = {};
let cache = { categories: null };

function route() {
  const h = (location.hash.replace('#', '') || 'dashboard').split('?')[0];
  const m = /^order-(\d+)$/.exec(h);
  if (m) return { page: 'orders', order: Number(m[1]) };
  return { page: pages[h] ? h : 'dashboard' };
}

async function render() {
  if (!token) return logout();
  const r = route();
  $$('#snav a').forEach((a) => a.classList.toggle('on', a.dataset.p === r.page));
  const main = $('#main');
  if (main.dataset.page !== r.page) {
    main.dataset.page = r.page;
    main.innerHTML = loading();
    window.scrollTo(0, 0);
  }
  try {
    await pages[r.page](main, r);
  } catch (e) {
    main.innerHTML = `<div class="empty"><b>Yuklab bo'lmadi</b>${esc(e.message)}<br><br><button class="btn btn-ghost" onclick="location.reload()">Qayta yuklash</button></div>`;
  }
  if (r.order) openOrder(r.order);
}
window.addEventListener('hashchange', () => { closeModal(); if (!/^#order-/.test(location.hash)) closeDrawer(); render(); });

function setCheckingBadge(n) {
  const b = $('#navChecking');
  b.textContent = n;
  b.hidden = !n;
}

/* ---------------- dashboard ---------------- */
pages.dashboard = async (main) => {
  const d = await api('stats');
  const T = d.totals;
  setCheckingBadge(T.checking);
  const max = Math.max(1, ...d.days.map((x) => Number(x.revenue)));
  const setup = [
    { done: d.setup.card, t: 'Karta raqamini kiriting', s: "Mijozlar to'lovni shu kartaga o'tkazadi", btn: '<a class="btn btn-gold sm" href="#settings">Kiritish</a>' },
    { done: !!d.setup.webapp_url, t: 'Botni saytga ulang', s: 'Bot menyusida «Do\'kon» tugmasi paydo bo\'ladi', btn: '<button class="btn btn-gold sm" data-setup-bot>Ulash</button>' },
    { done: d.setup.admins, t: 'Buyurtma xabarlarini Telegram\'da oling', s: 'Botga <code>/admin PAROL</code> deb yozing — yangi buyurtmalar va cheklar shu chatga keladi', btn: '<a class="btn btn-ghost sm" href="#settings">Batafsil</a>' },
  ];
  const pending = setup.filter((x) => !x.done);
  main.innerHTML = `
  <div class="ph"><div><h1>Boshqaruv paneli</h1><p>Bugungi holat va so'nggi buyurtmalar</p></div>
    <div class="acts"><a class="btn btn-ghost" href="#products">${ic('plus')} Mahsulot qo'shish</a></div></div>
  ${pending.length ? `<div class="setup">${setup.map((x) => `<div class="setup-item${x.done ? ' done' : ''}"><span class="si">${ic(x.done ? 'check' : 'clock')}</span><div><b>${x.t}</b><small>${x.s}</small></div>${x.done ? '' : x.btn}</div>`).join('')}</div>` : ''}
  <div class="grid-kpi">
    <a class="kpi${T.checking ? ' hot' : ''}" href="#orders?checking"><span class="ki">${ic('clock')}</span><small>Tekshirilishi kerak</small><b>${T.checking}</b></a>
    <a class="kpi${T.to_ship ? ' hot' : ''}" href="#orders"><span class="ki">${ic('truck')}</span><small>Jo'natish kerak</small><b>${T.to_ship}</b></a>
    <div class="kpi"><span class="ki">${ic('bag')}</span><small>Bugungi buyurtmalar</small><b>${T.today_orders}</b></div>
    <div class="kpi"><span class="ki">${ic('money')}</span><small>Bugungi tushum</small><b>${fmt(T.today_revenue)}</b></div>
    <div class="kpi"><span class="ki">${ic('chart')}</span><small>30 kunlik tushum</small><b>${fmt(T.month_revenue)}</b></div>
    <div class="kpi"><span class="ki">${ic('users')}</span><small>Mijozlar</small><b>${T.customers}</b></div>
  </div>
  <div class="two">
    <div class="card"><h2>Tushum — so'nggi 14 kun</h2><p class="sub">To'langan buyurtmalar bo'yicha, so'mda</p>
      <div class="chart">${d.days.map((x) => {
        const h = Math.round((Number(x.revenue) / max) * 100);
        const day = x.day.slice(8, 10) + '.' + x.day.slice(5, 7);
        return `<div class="bar" title="${day}: ${money(x.revenue)} · ${x.orders} ta"><i class="${Number(x.revenue) ? '' : 'zero'}" style="height:${Math.max(h, 2)}%"></i><span>${x.day.slice(8, 10)}</span></div>`;
      }).join('')}</div></div>
    <div class="card"><h2>Do'kon</h2><p class="sub">Umumiy ko'rsatkichlar</p>
      <dl class="kv">
        <dt>Mahsulotlar</dt><dd>${T.active_products} faol / ${T.products} jami</dd>
        <dt>Kategoriyalar</dt><dd>${T.categories}</dd>
        <dt>Buyurtmalar</dt><dd>${T.total_orders}</dd>
        <dt>Mijozlar</dt><dd>${T.customers}</dd>
      </dl></div>
  </div>
  <div class="ph" style="margin:28px 0 12px"><h1 style="font-size:18px">So'nggi buyurtmalar</h1><a class="btn btn-ghost sm" href="#orders">Hammasi ${ic('right')}</a></div>
  ${ordersTable(d.recent)}`;
  const sb = $('[data-setup-bot]', main);
  if (sb) sb.onclick = () => busyBtn(sb, async () => { await api('bot-setup', { body: {} }); toast('Bot ulandi'); render(); });
  bindOrderRows(main);
};

function ordersTable(rows) {
  if (!rows.length) return `<div class="table-wrap"><div class="empty"><b>Buyurtmalar hali yo'q</b>Mijozlar buyurtma berganda shu yerda ko'rinadi</div></div>`;
  return `<div class="table-wrap"><table><thead><tr><th>№</th><th>Sana</th><th>Mijoz</th><th>Mahsulotlar</th><th>Summa</th><th>Holat</th></tr></thead><tbody>
  ${rows.map((o) => `<tr data-order="${o.id}">
    <td><b>#${o.id}</b></td>
    <td class="num">${fmtDate(o.created_at, true)}</td>
    <td><b>${esc(o.customer_name)}</b><small class="num">${esc(o.phone)}</small></td>
    <td><div class="thumbs">${(o.items || []).slice(0, 4).map((it) => `<img src="${esc(it.image || '/img/logo-mark.png')}" alt="" loading="lazy">`).join('')}</div></td>
    <td class="num"><b>${money(o.total)}</b></td>
    <td>${chip(o.status)}</td>
  </tr>`).join('')}</tbody></table></div>`;
}
function bindOrderRows(root) {
  $$('[data-order]', root).forEach((tr) => { tr.onclick = () => { history.replaceState(null, '', `#order-${tr.dataset.order}`); openOrder(Number(tr.dataset.order)); }; });
}

/* ---------------- orders ---------------- */
const ordState = { status: '', q: '' };
pages.orders = async (main) => {
  if (location.hash === '#orders?checking') ordState.status = 'checking';
  const qs = new URLSearchParams();
  if (ordState.status) qs.set('status', ordState.status);
  if (ordState.q) qs.set('q', ordState.q);
  const d = await api('orders', { qs: qs.toString() });
  const total = Object.values(d.counts).reduce((a, b) => a + b, 0);
  setCheckingBadge(d.counts.checking || 0);
  const tabs = [['', 'Hammasi', total], ...['checking', 'paid', 'shipping', 'delivered', 'awaiting_payment', 'rejected', 'cancelled'].map((s) => [s, STATUS[s], d.counts[s] || 0])]
    .filter(([s, , n]) => !s || n || s === ordState.status || ['checking', 'paid', 'shipping', 'delivered'].includes(s));
  main.innerHTML = `
  <div class="ph"><div><h1>Buyurtmalar</h1><p>To'lovni tekshiring va buyurtma holatini yangilang — mijozga avtomatik xabar boradi</p></div>
    <div class="acts"><button class="btn btn-ghost" id="refresh">${ic('refresh')} Yangilash</button></div></div>
  <div class="tabs">${tabs.map(([s, l, n]) => `<button class="tab${ordState.status === s ? ' on' : ''}" data-st="${s}">${l} <em>${n}</em></button>`).join('')}</div>
  <div class="toolbar"><label class="search">${ic('search')}<input class="input" id="oq" placeholder="Ism, telefon yoki buyurtma raqami" value="${esc(ordState.q)}"></label></div>
  ${ordersTable(d.orders)}`;
  $$('[data-st]', main).forEach((b) => { b.onclick = () => { ordState.status = b.dataset.st; if (location.hash !== '#orders') history.replaceState(null, '', '#orders'); render(); }; });
  let deb;
  const q = $('#oq', main);
  q.oninput = () => { clearTimeout(deb); deb = setTimeout(async () => { ordState.q = q.value.trim(); await render(); const q2 = $('#oq'); q2.focus(); q2.setSelectionRange(q2.value.length, q2.value.length); }, 350); };
  $('#refresh', main).onclick = () => render();
  bindOrderRows(main);
};

async function openOrder(id) {
  const dr = openDrawer(`<div class="mh"><h2>Buyurtma #${id}</h2><button class="icon-btn" data-close-drawer>${ic('x')}</button></div><div class="mb">${loading()}</div>`);
  let o;
  try { o = (await api('order', { qs: `id=${id}` })).order; }
  catch (e) { $('.mb', dr).innerHTML = `<div class="empty"><b>Topilmadi</b>${esc(e.message)}</div>`; return; }
  const items = o.items || [];
  const next = NEXT[o.status] || [];
  $('.drawer').innerHTML = `
  <div class="mh"><div><h2>Buyurtma #${o.id}</h2><small class="muted">${fmtDate(o.created_at)}</small></div><div style="display:flex;gap:10px;align-items:center">${chip(o.status)}<button class="icon-btn" data-close-drawer>${ic('x')}</button></div></div>
  <div class="mb">
    <div class="sec-t">Mijoz</div>
    <dl class="kv">
      <dt>Ism</dt><dd>${esc(o.customer_name)}</dd>
      <dt>Telefon</dt><dd><a href="tel:${esc(o.phone.replace(/[^\d+]/g, ''))}" class="num">${esc(o.phone)}</a></dd>
      ${o.username ? `<dt>Telegram</dt><dd><a href="https://t.me/${esc(o.username)}" target="_blank" rel="noopener">@${esc(o.username)}</a></dd>` : (o.tg_id ? `<dt>Telegram ID</dt><dd><a href="tg://user?id=${o.tg_id}">${o.tg_id}</a></dd>` : '')}
      <dt>Qabul qilish</dt><dd>${o.delivery_type === 'pickup' ? "Do'kondan olib ketadi" : `Yetkazib berish — ${esc(o.region || '')}`}</dd>
      ${o.address ? `<dt>Manzil</dt><dd>${esc(o.address)}</dd>` : ''}
      ${o.comment ? `<dt>Izoh</dt><dd>${esc(o.comment)}</dd>` : ''}
      <dt>To'lov</dt><dd>${o.payment_method === 'online' ? 'Onlayn (Click/Payme)' : "Kartaga o'tkazma"}${o.paid_at ? ` · <span class="muted">${fmtDate(o.paid_at)}</span>` : ''}</dd>
    </dl>
    <div class="sec-t">Mahsulotlar (${items.reduce((a, i) => a + i.qty, 0)} dona)</div>
    ${items.map((it) => `<div class="oitem"><img src="${esc(it.image || '/img/logo-mark.png')}" alt=""><div class="t"><b>${esc(it.name)}</b><small>${[it.size && `O'lcham: ${esc(it.size)}`, it.color && esc(it.color), `${it.qty} × ${money(it.price)}`].filter(Boolean).join(' · ')}</small></div><div class="p num">${money(it.price * it.qty)}</div></div>`).join('')}
    <div class="totals">
      <div><span>Mahsulotlar</span><b class="num">${money(o.subtotal)}</b></div>
      ${o.delivery_type === 'delivery' ? `<div><span>Yetkazib berish</span><b class="num">${o.delivery_price ? money(o.delivery_price) : 'Bepul'}</b></div>` : ''}
      <div class="big"><span>Jami</span><b class="num">${money(o.total)}</b></div>
    </div>
    ${o.receipt_id ? `<div class="sec-t">To'lov cheki</div><a class="receipt" id="rcpt" target="_blank" rel="noopener">${loading()}</a>` : ''}
    <div class="sec-t">Holatni o'zgartirish</div>
    ${next.length ? `<div class="status-acts">${next.map(([s, l, c]) => `<button class="btn ${c}" data-set="${s}">${l}</button>`).join('')}</div>` : '<p class="muted" style="margin:0 0 10px">Buyurtma yakunlangan.</p>'}
    <div class="fgrid" style="margin-top:14px">
      <label class="field"><span>Boshqa holat</span><select class="input" id="stSel">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}"${k === o.status ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
      <label class="field" style="justify-content:flex-end"><span>&nbsp;</span><span class="switch"><input type="checkbox" id="notify" checked> Mijozga xabar yuborish</span></label>
      <label class="field full"><span>Admin izohi <span class="hint">(rad etish/bekor qilishda mijozga ham ko'rsatiladi)</span></span><textarea class="input" id="note" rows="2" placeholder="Masalan: chekdagi summa mos kelmadi">${esc(o.admin_note || '')}</textarea></label>
    </div>
  </div>
  <div class="mf"><button class="btn btn-ghost" id="saveNote">Izohni saqlash</button><button class="btn btn-gold" id="applySt">Holatni saqlash</button></div>`;

  if (o.receipt_id) {
    api('receipt', { qs: `id=${o.id}`, raw: true }).then(async (r) => {
      const url = URL.createObjectURL(await r.blob());
      const a = $('#rcpt');
      if (a) { a.href = url; a.innerHTML = `<img src="${url}" alt="To'lov cheki">`; }
    }).catch(() => { const a = $('#rcpt'); if (a) a.innerHTML = '<div class="empty">Chekni yuklab bo\'lmadi</div>'; });
  }
  const setStatus = async (status, btn) => busyBtn(btn, async () => {
    await api('order-status', { body: { id: o.id, status, note: $('#note').value, notify: $('#notify').checked } });
    toast(`#${o.id}: ${STATUS[status]}`);
    openOrder(o.id);
    if ($('#main').dataset.page === 'orders' || $('#main').dataset.page === 'dashboard') pages[$('#main').dataset.page]($('#main'), {}).catch(() => {});
  });
  $$('[data-set]').forEach((b) => { b.onclick = () => setStatus(b.dataset.set, b); });
  $('#applySt').onclick = (e) => setStatus($('#stSel').value, e.currentTarget);
  $('#saveNote').onclick = (e) => busyBtn(e.currentTarget, async () => { await api('order-note', { body: { id: o.id, note: $('#note').value } }); toast('Izoh saqlandi'); });
}

/* ---------------- products ---------------- */
const prodState = { q: '', cat: '' };
async function getCategories(force) {
  if (!cache.categories || force) cache.categories = (await api('categories')).categories;
  return cache.categories;
}

pages.products = async (main) => {
  const [{ products }, cats] = await Promise.all([api('products'), getCategories(true)]);
  cache.products = products;
  main.innerHTML = `
  <div class="ph"><div><h1>Mahsulotlar</h1><p>${products.length} ta mahsulot · narx, o'lcham va rasmlarni shu yerda boshqaring</p></div>
    <div class="acts"><button class="btn btn-gold" id="addP">${ic('plus')} Mahsulot qo'shish</button></div></div>
  <div class="toolbar">
    <label class="search">${ic('search')}<input class="input" id="pq" placeholder="Nomi, brend yoki rang" value="${esc(prodState.q)}"></label>
    <select class="input" id="pcat" style="width:auto;min-width:190px"><option value="">Barcha kategoriyalar</option>${cats.map((c) => `<option value="${c.id}"${String(c.id) === prodState.cat ? ' selected' : ''}>${esc(c.name)} (${c.products})</option>`).join('')}</select>
  </div>
  <div class="pgrid" id="pgrid"></div>`;
  const draw = () => {
    const q = prodState.q.toLowerCase().replace(/['ʻʼ`’]/g, '');
    const list = products.filter((p) => (!prodState.cat || String(p.category_id) === prodState.cat)
      && (!q || [p.name, p.brand, p.color, p.category_name].join(' ').toLowerCase().replace(/['ʻʼ`’]/g, '').includes(q)));
    $('#pgrid').innerHTML = list.length ? list.map((p) => `
      <div class="pc${p.is_active ? '' : ' off'}" data-id="${p.id}">
        <div class="pi" data-edit="${p.id}"><img src="${esc(p.images[0] || '/img/logo-mark.png')}" alt="" loading="lazy">
          <div class="tags">${p.is_featured ? '<span>Banner</span>' : ''}${p.is_new ? '<span>Yangi</span>' : ''}${p.badge ? `<span>${esc(p.badge)}</span>` : ''}${p.in_stock ? '' : '<span class="red">Tugagan</span>'}</div></div>
        <div class="pb"><small>${esc(p.category_name || 'Kategoriyasiz')}</small><b>${esc(p.name)}</b>
          <span class="muted" style="font-size:12.5px">${esc([p.color, p.sizes.join(', ')].filter(Boolean).join(' · '))}</span>
          <span class="pr">${money(p.price)}${p.old_price ? `<s>${fmt(p.old_price)}</s>` : ''}</span>
          <div class="pf"><label class="switch"><input type="checkbox" data-patch="is_active"${p.is_active ? ' checked' : ''}> Faol</label>
            <label class="switch"><input type="checkbox" data-patch="in_stock"${p.in_stock ? ' checked' : ''}> Bor</label>
            <span class="icons"><button class="icon-btn" data-edit="${p.id}" title="Tahrirlash">${ic('edit')}</button><button class="icon-btn danger" data-del="${p.id}" title="O'chirish">${ic('trash')}</button></span></div>
        </div>
      </div>`).join('') : '<div class="empty" style="grid-column:1/-1"><b>Mahsulot topilmadi</b></div>';
  };
  draw();
  $('#pq').oninput = (e) => { prodState.q = e.target.value; draw(); };
  $('#pcat').onchange = (e) => { prodState.cat = e.target.value; draw(); };
  $('#addP').onclick = () => editProduct(null, cats);
  $('#pgrid').onclick = async (e) => {
    const ed = e.target.closest('[data-edit]');
    if (ed) return editProduct(products.find((p) => p.id === Number(ed.dataset.edit)), cats);
    const del = e.target.closest('[data-del]');
    if (del) {
      const p = products.find((x) => x.id === Number(del.dataset.del));
      if (await confirmBox(`«${esc(p.name)}» o'chirilsinmi? Buni qaytarib bo'lmaydi. Vaqtincha yashirish uchun «Faol» tugmasini o'chiring.`)) {
        try { await api('product-delete', { body: { id: p.id } }); toast("Mahsulot o'chirildi"); render(); } catch (err) { toast(err.message, true); }
      }
    }
  };
  $('#pgrid').onchange = async (e) => {
    const sw = e.target.closest('[data-patch]');
    if (!sw) return;
    const id = Number(sw.closest('[data-id]').dataset.id);
    try {
      const r = await api('product-patch', { body: { id, field: sw.dataset.patch, value: sw.checked } });
      Object.assign(products.find((p) => p.id === id), r.product);
      draw();
      toast('Saqlandi');
    } catch (err) { sw.checked = !sw.checked; toast(err.message, true); }
  };
};

function editProduct(p, cats) {
  const isNew = !p;
  const st = { images: p ? [...p.images] : [] };
  const m = openModal(`
  <div class="mh"><h2>${isNew ? 'Yangi mahsulot' : 'Mahsulotni tahrirlash'}</h2><button class="icon-btn" data-close>${ic('x')}</button></div>
  <form class="mb" id="pform">
    <div class="field"><span>Rasmlar <span class="hint">— birinchi rasm asosiy bo'ladi</span></span><div class="imgs" id="imgs"></div></div>
    <div class="fgrid" style="margin-top:16px">
      <label class="field full"><span>Nomi *</span><input class="input" name="name" required maxlength="120" value="${esc(p?.name || '')}" placeholder="Masalan: Arte Puro kuzgi kurtka"></label>
      <label class="field"><span>Kategoriya</span><select class="input" name="category_id"><option value="">— tanlang —</option>${cats.map((c) => `<option value="${c.id}"${p?.category_id === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
      <label class="field"><span>Brend</span><input class="input" name="brand" maxlength="60" value="${esc(p?.brand || '')}" placeholder="Arte Puro, Ramsey..."></label>
      <label class="field"><span>Narx (so'm) *</span><input class="input num" name="price" inputmode="numeric" required value="${p ? fmt(p.price) : ''}" placeholder="450 000"></label>
      <label class="field"><span>Eski narx <span class="hint">— chegirma uchun</span></span><input class="input num" name="old_price" inputmode="numeric" value="${p?.old_price ? fmt(p.old_price) : ''}" placeholder="Bo'sh qoldiring"></label>
      <label class="field"><span>Rang</span><input class="input" name="color" maxlength="60" value="${esc(p?.color || '')}" placeholder="To'q ko'k"></label>
      <label class="field"><span>Belgi (yorliq)</span><input class="input" name="badge" maxlength="20" value="${esc(p?.badge || '')}" placeholder="Yangi, Xit, Lux..."></label>
      <label class="field full"><span>O'lchamlar <span class="hint">— vergul bilan ajrating</span></span><input class="input" name="sizes" value="${esc((p?.sizes || []).join(', '))}" placeholder="M, L, XL, 2XL">
        <div class="presets">${SIZE_PRESETS.map(([l, v]) => `<button type="button" data-preset="${esc(v)}">${l}: ${esc(v)}</button>`).join('')}</div></label>
      <label class="field full"><span>Tavsif</span><textarea class="input" name="description" rows="3" maxlength="2000" placeholder="Material, mavsum, parvarish...">${esc(p?.description || '')}</textarea></label>
      <label class="field"><span>Tartib raqami <span class="hint">— kichigi oldinda</span></span><input class="input num" name="sort" inputmode="numeric" value="${p?.sort ?? 0}"></label>
      <div class="field"><span>Holat</span><div style="display:flex;flex-wrap:wrap;gap:14px 18px;padding-top:8px">
        <label class="switch"><input type="checkbox" name="is_active"${!p || p.is_active ? ' checked' : ''}> Faol</label>
        <label class="switch"><input type="checkbox" name="in_stock"${!p || p.in_stock ? ' checked' : ''}> Sotuvda bor</label>
        <label class="switch"><input type="checkbox" name="is_new"${p?.is_new ? ' checked' : ''}> Yangi</label>
        <label class="switch"><input type="checkbox" name="is_featured"${p?.is_featured ? ' checked' : ''}> Bannerda</label>
      </div></div>
    </div>
  </form>
  <div class="mf"><button class="btn btn-ghost" data-close>Bekor qilish</button><button class="btn btn-gold" id="saveP">${ic('check')} Saqlash</button></div>`);

  const drawImgs = () => {
    $('#imgs', m).innerHTML = st.images.map((u, i) => `<div class="im"><img src="${esc(u)}" alt="">${i ? '' : '<span class="first">Asosiy</span>'}
      <div class="ia"><button type="button" data-mv="${i}" title="Oldinga">${ic('left')}</button><button type="button" data-rm="${i}" title="O'chirish">${ic('trash')}</button></div></div>`).join('')
      + `<label class="add">${ic('upload')}<span>Rasm qo'shish</span><input type="file" accept="image/*" multiple id="imgIn"></label>`;
    $('#imgIn', m).onchange = async (e) => {
      const files = [...e.target.files].slice(0, 10 - st.images.length);
      if (!files.length) return;
      const add = $('.add', m);
      add.innerHTML = '<span class="spin light"></span><span>Yuklanmoqda...</span>';
      try { st.images.push(...await uploadFiles(files)); } catch (err) { toast(err.message, true); }
      drawImgs();
    };
  };
  drawImgs();
  $('#imgs', m).onclick = (e) => {
    const mv = e.target.closest('[data-mv]');
    const rm = e.target.closest('[data-rm]');
    if (mv) { const i = Number(mv.dataset.mv); if (i > 0) { [st.images[i - 1], st.images[i]] = [st.images[i], st.images[i - 1]]; drawImgs(); } }
    if (rm) { st.images.splice(Number(rm.dataset.rm), 1); drawImgs(); }
  };
  $$('[data-preset]', m).forEach((b) => { b.onclick = () => { $('[name=sizes]', m).value = b.dataset.preset; }; });
  $$('[name=price],[name=old_price]', m).forEach((inp) => { inp.oninput = () => { const d = inp.value.replace(/\D/g, ''); inp.value = d ? fmt(d) : ''; }; });
  $('#pform', m).onsubmit = (e) => { e.preventDefault(); $('#saveP', m).click(); };
  $('#saveP', m).onclick = (e) => busyBtn(e.currentTarget, async () => {
    const f = $('#pform', m);
    const v = (n) => f.elements[n].value;
    const c = (n) => f.elements[n].checked;
    const body = {
      id: p?.id, name: v('name'), category_id: v('category_id') || null, brand: v('brand'), color: v('color'), badge: v('badge'),
      price: v('price').replace(/\D/g, ''), old_price: v('old_price').replace(/\D/g, '') || null,
      sizes: v('sizes').split(',').map((s) => s.trim()).filter(Boolean), description: v('description'), sort: v('sort'),
      images: st.images, is_active: c('is_active'), in_stock: c('in_stock'), is_new: c('is_new'), is_featured: c('is_featured'),
    };
    await api('product-save', { body });
    closeModal();
    toast(isNew ? "Mahsulot qo'shildi" : 'Saqlandi');
    render();
  });
}

/* ---------------- categories ---------------- */
pages.categories = async (main) => {
  const cats = await getCategories(true);
  main.innerHTML = `
  <div class="ph"><div><h1>Kategoriyalar</h1><p>Katalogdagi bo'limlar va ularning tartibi</p></div>
    <div class="acts"><button class="btn btn-gold" id="addC">${ic('plus')} Kategoriya qo'shish</button></div></div>
  <div class="table-wrap"><table><thead><tr><th>Rasm</th><th>Nomi</th><th>Ruscha</th><th>Mahsulotlar</th><th>Tartib</th><th>Holat</th><th></th></tr></thead><tbody>
  ${cats.map((c) => `<tr data-c="${c.id}">
    <td><img src="${esc(c.image || '/img/logo-mark.png')}" alt="" style="width:44px;height:44px;border-radius:12px;object-fit:cover"></td>
    <td><b>${esc(c.name)}</b></td><td class="muted">${esc(c.name_ru || '—')}</td><td class="num">${c.products}</td><td class="num">${c.sort}</td>
    <td>${c.is_active ? '<span class="st paid">Faol</span>' : '<span class="st cancelled">Yashirin</span>'}</td>
    <td style="text-align:right;white-space:nowrap"><button class="icon-btn" data-ce="${c.id}" style="display:inline-grid">${ic('edit')}</button> <button class="icon-btn danger" data-cd="${c.id}" style="display:inline-grid">${ic('trash')}</button></td>
  </tr>`).join('')}</tbody></table>${cats.length ? '' : '<div class="empty"><b>Kategoriyalar yo\'q</b></div>'}</div>
  <p class="muted" style="margin-top:12px;font-size:13px">Rasm qo'yilmasa, kategoriyadagi birinchi mahsulot rasmi ishlatiladi.</p>`;
  $('#addC').onclick = () => editCategory(null);
  $('tbody', main).onclick = async (e) => {
    const del = e.target.closest('[data-cd]');
    if (del) {
      e.stopPropagation();
      const c = cats.find((x) => x.id === Number(del.dataset.cd));
      if (await confirmBox(`«${esc(c.name)}» kategoriyasi o'chirilsinmi? Undagi ${c.products} ta mahsulot kategoriyasiz qoladi.`)) {
        try { await api('category-delete', { body: { id: c.id } }); toast("O'chirildi"); render(); } catch (err) { toast(err.message, true); }
      }
      return;
    }
    const row = e.target.closest('[data-c]');
    if (row) editCategory(cats.find((x) => x.id === Number(row.dataset.c)));
  };
};

function editCategory(c) {
  const st = { image: c?.image || '' };
  const m = openModal(`
  <div class="mh"><h2>${c ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}</h2><button class="icon-btn" data-close>${ic('x')}</button></div>
  <form class="mb" id="cform"><div class="fgrid">
    <div class="field full"><span>Rasm</span><div class="imgs" id="cimg"></div></div>
    <label class="field"><span>Nomi (o'zbekcha) *</span><input class="input" name="name" required maxlength="60" value="${esc(c?.name || '')}"></label>
    <label class="field"><span>Nomi (ruscha)</span><input class="input" name="name_ru" maxlength="60" value="${esc(c?.name_ru || '')}"></label>
    <label class="field"><span>Tartib raqami</span><input class="input num" name="sort" inputmode="numeric" value="${c?.sort ?? 0}"></label>
    <div class="field"><span>Holat</span><label class="switch" style="padding-top:10px"><input type="checkbox" name="is_active"${!c || c.is_active ? ' checked' : ''}> Katalogda ko'rsatish</label></div>
  </div></form>
  <div class="mf"><button class="btn btn-ghost" data-close>Bekor qilish</button><button class="btn btn-gold" id="saveC">${ic('check')} Saqlash</button></div>`, 'sm');
  const draw = () => {
    $('#cimg', m).innerHTML = (st.image ? `<div class="im"><img src="${esc(st.image)}" alt=""><div class="ia"><span></span><button type="button" data-rm>${ic('trash')}</button></div></div>` : '')
      + `<label class="add">${ic('upload')}<span>${st.image ? 'Almashtirish' : 'Rasm yuklash'}</span><input type="file" accept="image/*" id="cIn"></label>`;
    $('#cIn', m).onchange = async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      $('.add', m).innerHTML = '<span class="spin light"></span>';
      try { st.image = (await uploadFiles([f]))[0]; } catch (err) { toast(err.message, true); }
      draw();
    };
    const rm = $('[data-rm]', m);
    if (rm) rm.onclick = () => { st.image = ''; draw(); };
  };
  draw();
  $('#cform', m).onsubmit = (e) => { e.preventDefault(); $('#saveC', m).click(); };
  $('#saveC', m).onclick = (e) => busyBtn(e.currentTarget, async () => {
    const f = $('#cform', m);
    await api('category-save', { body: { id: c?.id, name: f.elements.name.value, name_ru: f.elements.name_ru.value, sort: f.elements.sort.value, is_active: f.elements.is_active.checked, image: st.image } });
    closeModal();
    toast('Saqlandi');
    render();
  });
}

/* ---------------- customers ---------------- */
pages.customers = async (main) => {
  const d = await api('customers');
  const admins = new Set(d.admin_chat_ids);
  main.innerHTML = `
  <div class="ph"><div><h1>Mijozlar</h1><p>Botni ishga tushirgan yoki buyurtma bergan foydalanuvchilar · ${d.customers.length} ta</p></div></div>
  <div class="table-wrap"><table><thead><tr><th>Mijoz</th><th>Telefon</th><th>Buyurtmalar</th><th>Xaridlar</th><th>Oxirgi faollik</th><th>Admin xabarlari</th></tr></thead><tbody>
  ${d.customers.map((u) => `<tr style="cursor:default">
    <td><b>${esc([u.first_name, u.last_name].filter(Boolean).join(' ') || '—')}</b><small>${u.username ? `<a href="https://t.me/${esc(u.username)}" target="_blank" rel="noopener" style="color:var(--gold-hi)">@${esc(u.username)}</a>` : `ID ${u.tg_id}`}</small></td>
    <td class="num">${esc(u.phone || '—')}</td><td class="num">${u.orders}</td><td class="num"><b>${money(u.spent)}</b></td>
    <td class="num">${fmtDate(u.last_seen)}</td>
    <td><label class="switch"><input type="checkbox" data-adm="${u.tg_id}"${admins.has(String(u.tg_id)) ? ' checked' : ''}> Admin</label></td>
  </tr>`).join('')}</tbody></table>${d.customers.length ? '' : '<div class="empty"><b>Hali mijozlar yo\'q</b>Botga /start bosganlar shu yerda ko\'rinadi</div>'}</div>
  <p class="muted" style="margin-top:12px;font-size:13px">«Admin» yoqilgan foydalanuvchilarga yangi buyurtmalar va to'lov cheklari Telegram orqali yuboriladi va ular tasdiqlash tugmalarini bosa oladi.</p>`;
  $$('[data-adm]', main).forEach((sw) => {
    sw.onchange = async () => {
      try { await api('admin-chat', { body: { chat_id: sw.dataset.adm, on: sw.checked } }); toast(sw.checked ? 'Admin qilindi' : 'Adminlikdan olindi'); }
      catch (err) { sw.checked = !sw.checked; toast(err.message, true); }
    };
  });
};

/* ---------------- settings ---------------- */
pages.settings = async (main) => {
  const [{ settings: s }, bot] = await Promise.all([api('settings'), api('bot-info').catch(() => ({}))]);
  const me = bot.me;
  const wh = bot.webhook || {};
  const whOk = wh.url && /\/api\/bot$/.test(wh.url);
  main.innerHTML = `
  <div class="ph"><div><h1>Sozlamalar</h1><p>To'lov, yetkazib berish, do'kon ma'lumotlari va Telegram bot</p></div></div>
  <form id="sform" class="set-grid">
    <section class="card"><h2>💳 Karta orqali to'lov</h2><p class="sub">Mijoz shu kartaga pul o'tkazadi va chek (skrinshot) yuboradi. Siz chekni tekshirib tasdiqlaysiz.</p>
      <div class="fgrid">
        <label class="field"><span>Karta raqami *</span><input class="input num" name="card_number" inputmode="numeric" maxlength="23" value="${esc(s.card_number)}" placeholder="8600 1234 5678 9012"></label>
        <label class="field"><span>Karta turi</span><select class="input" name="card_type">${['Uzcard', 'Humo', 'Visa', 'Mastercard'].map((x) => `<option${s.card_type === x ? ' selected' : ''}>${x}</option>`).join('')}</select></label>
        <label class="field full"><span>Karta egasi (ism familiya)</span><input class="input" name="card_holder" maxlength="60" value="${esc(s.card_holder)}" placeholder="ABDURAHMON TOXTASINOV"></label>
      </div>
    </section>
    <section class="card"><h2>⚡ Onlayn to'lov (ixtiyoriy)</h2><p class="sub">Click yoki Payme orqali Telegram ichida karta bilan to'lash. Token olish: @BotFather → botingiz → Payments → Click/Payme ni tanlang va ulaning.</p>
      <label class="field"><span>Payment provider token</span><input class="input" name="provider_token" value="${esc(s.provider_token)}" placeholder="398062629:LIVE:..." autocomplete="off"><span class="hint">Bo'sh qolsa, faqat kartaga o'tkazma usuli ishlaydi.</span></label>
    </section>
    <section class="card"><h2>🚚 Yetkazib berish</h2><p class="sub">Narx 0 bo'lsa, yetkazib berish bepul deb ko'rsatiladi.</p>
      <div class="fgrid">
        <label class="field"><span>Yetkazib berish narxi (so'm)</span><input class="input num" name="delivery_price" inputmode="numeric" value="${fmt(s.delivery_price)}"></label>
        <label class="field"><span>Bepul yetkazish (shu summadan)</span><input class="input num" name="free_delivery_from" inputmode="numeric" value="${fmt(s.free_delivery_from)}"><span class="hint">0 — cheklov yo'q</span></label>
        <label class="field full"><span>Yetkazib berish haqida izoh</span><input class="input" name="delivery_note" maxlength="200" value="${esc(s.delivery_note)}"></label>
        <label class="switch full"><input type="checkbox" name="pickup_enabled"${s.pickup_enabled ? ' checked' : ''}> Do'kondan olib ketish imkoniyati</label>
      </div>
    </section>
    <section class="card"><h2>🏬 Do'kon ma'lumotlari</h2><p class="sub">Ilovada va botda ko'rsatiladi</p>
      <div class="fgrid">
        <label class="field"><span>Do'kon nomi</span><input class="input" name="shop_name" maxlength="60" value="${esc(s.shop_name)}"></label>
        <label class="field"><span>Ish vaqti</span><input class="input" name="working_hours" maxlength="60" value="${esc(s.working_hours)}"></label>
        <label class="field full"><span>Manzil</span><input class="input" name="address" maxlength="200" value="${esc(s.address)}"></label>
        <label class="field"><span>Telefonlar <span class="hint">— har biri yangi qatorda</span></span><textarea class="input num" name="phones" rows="3">${esc((s.phones || []).join('\n'))}</textarea></label>
        <div class="fgrid" style="grid-template-columns:1fr;gap:14px">
          <label class="field"><span>Instagram</span><input class="input" name="instagram" maxlength="60" value="${esc(s.instagram)}" placeholder="istanbul_braand"></label>
          <label class="field"><span>Telegram (admin username)</span><input class="input" name="telegram_contact" maxlength="60" value="${esc(s.telegram_contact)}" placeholder="username"></label>
        </div>
      </div>
    </section>
    <section class="card"><h2>🤖 Telegram bot</h2><p class="sub">Bot mijozlarga do'konni ochadi, buyurtma holatini xabar qiladi va sizga yangi buyurtmalarni yuboradi.</p>
      <div class="bot-box"><img src="/img/logo-mark.png" alt="">
        <div class="bi"><b>${me ? `@${esc(me.username)}` : 'Bot topilmadi'}</b>
          <small><span class="dot ${whOk ? 'ok' : 'bad'}"></span>${whOk ? `Ulangan: ${esc(wh.url)}` : 'Webhook ulanmagan'}${wh.last_error_message ? ` · Oxirgi xato: ${esc(wh.last_error_message)}` : ''}</small></div>
        ${me ? `<a class="btn btn-ghost sm" href="https://t.me/${esc(me.username)}" target="_blank" rel="noopener">${ic('link')} Ochish</a>` : ''}
        <button type="button" class="btn btn-gold sm" id="botSetup">${ic('refresh')} ${whOk ? 'Yangilash' : 'Ulash'}</button>
      </div>
      <div class="sec-t">Buyurtma xabarlari keladigan chatlar</div>
      <p class="muted" style="margin:0 0 10px;font-size:13px">Botga <code>/admin PAROL</code> deb yozing (PAROL — admin panel paroli). Shu chat avtomatik qo'shiladi. Guruhga ham qo'shish mumkin: botni guruhga qo'shib, guruhda shu buyruqni yozing.</p>
      <div class="chips" id="admChips">${(s.admin_chat_ids || []).map((id) => `<span class="chipx num">${esc(id)}<button type="button" data-rmadm="${esc(id)}" title="O'chirish">${ic('x')}</button></span>`).join('') || '<span class="muted">Hali ulanmagan</span>'}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
        <input class="input num" id="newAdm" placeholder="Chat ID qo'shish (masalan 123456789)" style="max-width:300px">
        <button type="button" class="btn btn-ghost" id="addAdm">${ic('plus')} Qo'shish</button>
        <button type="button" class="btn btn-ghost" id="testBot">${ic('send')} Sinov xabari</button>
      </div>
    </section>
    <div class="save-bar"><button class="btn btn-gold" id="saveS" type="submit">${ic('check')} Sozlamalarni saqlash</button></div>
  </form>`;
  const f = $('#sform');
  $$('[name=delivery_price],[name=free_delivery_from]', f).forEach((inp) => { inp.oninput = () => { const d = inp.value.replace(/\D/g, ''); inp.value = d ? fmt(d) : ''; }; });
  const card = f.elements.card_number;
  card.oninput = () => { const d = card.value.replace(/\D/g, '').slice(0, 19); card.value = d.replace(/(\d{4})(?=\d)/g, '$1 '); };
  f.onsubmit = (e) => {
    e.preventDefault();
    busyBtn($('#saveS'), async () => {
      const v = (n) => f.elements[n].value;
      await api('settings-save', { body: { settings: {
        card_number: v('card_number'), card_type: v('card_type'), card_holder: v('card_holder'), provider_token: v('provider_token'),
        delivery_price: v('delivery_price').replace(/\D/g, '') || 0, free_delivery_from: v('free_delivery_from').replace(/\D/g, '') || 0,
        delivery_note: v('delivery_note'), pickup_enabled: f.elements.pickup_enabled.checked,
        shop_name: v('shop_name'), working_hours: v('working_hours'), address: v('address'), phones: v('phones'),
        instagram: v('instagram'), telegram_contact: v('telegram_contact'),
      } } });
      toast('Sozlamalar saqlandi');
    });
  };
  $('#botSetup').onclick = (e) => busyBtn(e.currentTarget, async () => {
    const r = await api('bot-setup', { body: {} });
    const bad = Object.entries(r.results).filter(([, x]) => !x.ok);
    if (bad.length) throw new Error(`Xato: ${bad.map(([k, x]) => `${k} — ${x.description}`).join('; ')}`);
    toast(`Bot ulandi: ${r.base}`);
    render();
  });
  const setAdm = (id, on) => api('admin-chat', { body: { chat_id: id, on } }).then(() => { toast(on ? "Qo'shildi" : "O'chirildi"); render(); }).catch((err) => toast(err.message, true));
  $('#admChips').onclick = (e) => { const b = e.target.closest('[data-rmadm]'); if (b) setAdm(b.dataset.rmadm, false); };
  $('#addAdm').onclick = () => { const id = $('#newAdm').value.trim(); if (id) setAdm(id, true); };
  $('#testBot').onclick = (e) => busyBtn(e.currentTarget, async () => { await api('bot-test', { body: {} }); toast('Sinov xabari yuborildi'); });
};

/* ---------------- start ---------------- */
function start() {
  $('#login').hidden = true;
  $('#shell').hidden = false;
  $('#main').dataset.page = '';
  render();
  api('orders', { qs: 'status=checking' }).then((d) => setCheckingBadge(d.counts.checking || 0)).catch(() => {});
}

if (token) start(); else logout();
})();
