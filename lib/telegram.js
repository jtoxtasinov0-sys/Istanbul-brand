const api = (method) => `https://api.telegram.org/bot${process.env.BOT_TOKEN}/${method}`;

export async function tg(method, payload = {}) {
  try {
    const r = await fetch(api(method), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!j.ok) console.warn(`[tg] ${method}:`, j.description);
    return j;
  } catch (e) {
    console.warn(`[tg] ${method} xato:`, e.message);
    return { ok: false, description: e.message };
  }
}

// Rasmni fayl sifatida yuboradi (chek rasmi tashqi URL'siz)
export async function tgPhoto(chatId, buf, mime, caption, replyMarkup, replyTo) {
  try {
    const fd = new FormData();
    fd.append('chat_id', String(chatId));
    fd.append('photo', new Blob([buf], { type: mime }), mime === 'image/png' ? 'chek.png' : 'chek.jpg');
    if (caption) {
      fd.append('caption', caption);
      fd.append('parse_mode', 'HTML');
    }
    if (replyMarkup) fd.append('reply_markup', JSON.stringify(replyMarkup));
    if (replyTo) fd.append('reply_parameters', JSON.stringify({ message_id: replyTo, allow_sending_without_reply: true }));
    const r = await fetch(api('sendPhoto'), { method: 'POST', body: fd });
    const j = await r.json();
    if (!j.ok) console.warn('[tg] sendPhoto:', j.description);
    return j;
  } catch (e) {
    console.warn('[tg] sendPhoto xato:', e.message);
    return { ok: false };
  }
}
