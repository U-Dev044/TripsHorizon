import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(ROOT, 'data');
const BOOKINGS_FILE = path.join(DATA, 'bookings.json');
const SETTINGS_FILE = path.join(DATA, 'settings.json');
try {
  const envText = await readFile(path.join(ROOT, '.env'), 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
} catch {}
const PORT = Number(process.env.PORT || 3000);
const MODEL = process.env.OPENAI_MODEL || 'gpt-6';
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon' };
const sessions = new Map();
let bookings = [];
// DEMO WHATSAPP NUMBER: replace 12025550147 with your real WhatsApp number (country code + number, digits only).
// This is a reserved fictional US 555 number for demonstrations; it is not a real reception line.
const DEMO_WHATSAPP_NUMBER = '12025550147';
let settings = { whatsappNumber: DEMO_WHATSAPP_NUMBER, receptionName: 'TripsHorizon Reception', businessMessage: 'Hello! I would like help with my TripsHorizon reservation.' };
await mkdir(DATA, { recursive: true });
try { bookings = JSON.parse(await readFile(BOOKINGS_FILE, 'utf8')); if (!Array.isArray(bookings)) bookings = []; } catch {}
try { settings = { ...settings, ...JSON.parse(await readFile(SETTINGS_FILE, 'utf8')) }; } catch {}
// Keep the demo WhatsApp handoff active if a previous local settings file has an empty number.
if (!settings.whatsappNumber) settings.whatsappNumber = DEMO_WHATSAPP_NUMBER;

function send(res, status, data, type = 'application/json; charset=utf-8', extra = {}) {
  res.writeHead(status, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'DENY', ...extra });
  res.end(type.startsWith('application/json') ? JSON.stringify(data) : data);
}
async function readJson(req, maxBytes = 24_000) {
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > maxBytes) throw new Error('Request too large'); }
  return JSON.parse(raw || '{}');
}
const clean = (v, max = 180) => String(v ?? '').trim().slice(0, max);
const extractText = payload => {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) return payload.output_text.trim();
  const chunks = [];
  for (const item of payload.output || []) for (const part of item.content || []) if (part.type === 'output_text' && part.text) chunks.push(part.text);
  return chunks.join('\n').trim();
};
const cookieToken = req => (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith('th_admin='))?.slice('th_admin='.length);
function adminSession(req) {
  const token = cookieToken(req); const record = token && sessions.get(token);
  if (!record || record.expires < Date.now()) { if (token) sessions.delete(token); return null; }
  record.expires = Date.now() + 8 * 60 * 60 * 1000;
  return record;
}
const requireAdmin = (req, res) => {
  if (adminSession(req)) return true;
  send(res, 401, { error: 'Please sign in to the TripsHorizon admin dashboard.' }); return false;
};
const persistBookings = () => writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
const persistSettings = () => writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
const publicBooking = b => ({ reference: b.reference, type: b.type, from: b.from, to: b.to, date: b.date, returnDate: b.returnDate, travellers: b.travellers, option: b.option, amount: b.amount, currency: b.currency, status: b.status, createdAt: b.createdAt });

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (req.method === 'GET' && url.pathname === '/api/public-config') return send(res, 200, { whatsappNumber: settings.whatsappNumber, receptionName: settings.receptionName });

    if (req.method === 'POST' && url.pathname === '/api/bookings') {
      let body; try { body = await readJson(req); } catch { return send(res, 400, { error: 'Invalid booking details.' }); }
      const type = ['flights', 'hotels', 'cars', 'package'].includes(body.type) ? body.type : 'package';
      const name = clean(body.name, 120), email = clean(body.email, 180), phone = clean(body.phone, 40);
      const from = clean(body.from, 120), to = clean(body.to, 120), option = clean(body.option, 160);
      const amount = Number(body.amount);
      if (!name || !/^\S+@\S+\.\S+$/.test(email) || !phone || !from || !option || !Number.isFinite(amount) || amount < 0 || amount > 100000000) return send(res, 400, { error: 'Please provide valid contact, trip and estimate details.' });
      const booking = { reference: `TH-${new Date().toISOString().slice(2,10).replaceAll('-', '')}-${randomBytes(3).toString('hex').toUpperCase()}`, type, name, email, phone, from, to, date: clean(body.date, 20), returnDate: clean(body.returnDate, 20), travellers: Math.max(1, Math.min(20, Number(body.travellers) || 1)), option, amount: Math.round(amount * 100) / 100, currency: clean(body.currency || 'USD', 3).toUpperCase(), notes: clean(body.notes, 500), status: 'awaiting_reception', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      bookings.unshift(booking); await persistBookings();
      return send(res, 201, { booking: publicBooking(booking), whatsappNumberConfigured: Boolean(settings.whatsappNumber) });
    }
    if (req.method === 'GET' && url.pathname.startsWith('/api/bookings/')) {
      const ref = decodeURIComponent(url.pathname.split('/').pop()); const booking = bookings.find(b => b.reference === ref);
      if (!booking) return send(res, 404, { error: 'Reservation not found.' });
      return send(res, 200, { booking: publicBooking(booking) });
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/login') {
      let body; try { body = await readJson(req, 4000); } catch { return send(res, 400, { error: 'Invalid sign-in request.' }); }
      const expected = process.env.ADMIN_PASSWORD || '';
      if (!expected || expected.length < 12) return send(res, 503, { error: 'Admin access is not configured. Set a strong ADMIN_PASSWORD (at least 12 characters) in the private .env file.' });
      const supplied = String(body.password || '');
      const a = Buffer.from(supplied); const b = Buffer.from(expected);
      if (a.length !== b.length || !timingSafeEqual(a, b)) return send(res, 401, { error: 'Incorrect admin password.' });
      const token = randomBytes(32).toString('hex'); sessions.set(token, { expires: Date.now() + 8 * 60 * 60 * 1000 });
      return send(res, 200, { ok: true }, 'application/json; charset=utf-8', { 'Set-Cookie': `th_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV === 'production' ? '; Secure' : ''}` });
    }
    if (req.method === 'POST' && url.pathname === '/api/admin/logout') {
      const token = cookieToken(req); if (token) sessions.delete(token);
      return send(res, 200, { ok: true }, 'application/json; charset=utf-8', { 'Set-Cookie': 'th_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
    }
    if (url.pathname.startsWith('/api/admin/')) {
      if (!requireAdmin(req, res)) return;
      if (req.method === 'GET' && url.pathname === '/api/admin/bookings') return send(res, 200, { bookings });
      if (req.method === 'GET' && url.pathname === '/api/admin/settings') return send(res, 200, { settings });
      if (req.method === 'PUT' && url.pathname === '/api/admin/settings') {
        let body; try { body = await readJson(req, 5000); } catch { return send(res, 400, { error: 'Invalid settings.' }); }
        const number = String(body.whatsappNumber || '').replace(/[^0-9]/g, '');
        if (number && (number.length < 8 || number.length > 15)) return send(res, 400, { error: 'Enter the WhatsApp number with country code, 8–15 digits, without the plus sign.' });
        settings.whatsappNumber = number;
        settings.receptionName = clean(body.receptionName || 'TripsHorizon Reception', 80);
        settings.businessMessage = clean(body.businessMessage || 'Hello! I would like help with my TripsHorizon reservation.', 240);
        await persistSettings(); return send(res, 200, { settings });
      }
      if (req.method === 'PATCH' && url.pathname.startsWith('/api/admin/bookings/')) {
        const ref = decodeURIComponent(url.pathname.split('/').pop()); let body;
        try { body = await readJson(req, 3000); } catch { return send(res, 400, { error: 'Invalid status update.' }); }
        const allowed = ['awaiting_reception', 'awaiting_payment', 'paid', 'cancelled'];
        if (!allowed.includes(body.status)) return send(res, 400, { error: 'Unsupported booking status.' });
        const booking = bookings.find(b => b.reference === ref); if (!booking) return send(res, 404, { error: 'Reservation not found.' });
        booking.status = body.status; booking.updatedAt = new Date().toISOString(); await persistBookings(); return send(res, 200, { booking });
      }
      return send(res, 404, { error: 'Admin endpoint not found.' });
    }

    if (req.method === 'POST' && url.pathname === '/api/chat') {
      if (!process.env.OPENAI_API_KEY) return send(res, 503, { error: 'The TripsHorizon AI service is not configured yet. Add OPENAI_API_KEY to your server environment.' });
      let body; try { body = await readJson(req); } catch { return send(res, 400, { error: 'Please send a valid, compact JSON chat request.' }); }
      if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 12) return send(res, 400, { error: 'Send between 1 and 12 recent chat messages.' });
      const messages = body.messages.map(message => {
        if (!message || !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string') return null;
        const content = message.content.trim().slice(0, 1200); return content ? { role: message.role, content } : null;
      });
      if (messages.some(message => !message)) return send(res, 400, { error: 'One or more chat messages were invalid.' });
      const upstream = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(30_000), body: JSON.stringify({ model: MODEL, instructions: 'You are Horizon Assistant, the friendly travel-planning helper for TripsHorizon. Be concise, warm and practical. The site currently displays sample travel options and estimates; live supplier inventory is not connected. You cannot confirm prices, availability, reservations, refunds or payments. Direct customers to the TripsHorizon human reception for booking confirmation. Never request payment-card details, passwords or sensitive identity documents.', input: messages, max_output_tokens: 500 }) });
      if (!upstream.ok) { const detail = await upstream.text().catch(() => ''); console.error('OpenAI API error:', upstream.status, detail.slice(0, 700)); return send(res, 502, { error: 'The AI assistant could not respond just now. Please try again shortly.' }); }
      const reply = extractText(await upstream.json()); if (!reply) return send(res, 502, { error: 'The AI assistant returned an empty response. Please try again.' });
      return send(res, 200, { reply });
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed.' });
    const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const resolved = path.resolve(ROOT, `.${pathname}`);
    if (!resolved.startsWith(ROOT + path.sep) && resolved !== ROOT) return send(res, 403, { error: 'Forbidden.' });
    if (path.basename(resolved).startsWith('.') || pathname.startsWith('/data/')) return send(res, 404, { error: 'Not found.' });
    const data = await readFile(resolved); const type = MIME[path.extname(resolved).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Cache-Control': 'no-cache' });
    if (req.method === 'HEAD') return res.end(); return res.end(data);
  } catch (error) {
    if (error?.name === 'AbortError' || error?.name === 'TimeoutError') return send(res, 504, { error: 'The AI assistant took too long to respond. Please try again.' });
    if (error?.code === 'ENOENT') return send(res, 404, { error: 'Page not found.' });
    console.error(error); return send(res, 500, { error: 'Something went wrong on the TripsHorizon server.' });
  }
});
server.listen(PORT, '0.0.0.0', () => console.log(`TripsHorizon is running at http://localhost:${PORT}`));
