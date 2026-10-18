// Botni sayt manziliga ulaydi: npm run bot:setup -- https://sizning-sayt.vercel.app
import './env.mjs';
import { setupBot } from '../lib/botsetup.js';

const base = process.argv[2] || process.env.WEBAPP_URL;
if (!base) {
  console.error('Foydalanish: npm run bot:setup -- https://sizning-sayt.vercel.app');
  process.exit(1);
}
const r = await setupBot(base);
for (const [k, v] of Object.entries(r)) console.log(k.padEnd(12), v.ok ? '✓' : `✗ ${v.description}`);
